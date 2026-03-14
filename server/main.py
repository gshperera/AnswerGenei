from typing import Optional, TypedDict, Annotated, List, AsyncIterator
from langgraph.graph import StateGraph, END, add_messages
from langchain_core.messages import BaseMessage, AIMessage, SystemMessage, HumanMessage, ToolMessage, AIMessageChunk
from langchain_groq import ChatGroq
from langchain_tavily import TavilySearch
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
from dotenv import load_dotenv
from uuid import uuid4
import json
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

search_tool = TavilySearch(max_results=3)
tools = [search_tool]

llm = ChatGroq(model="llama-3.3-70b-versatile",temperature=0,)
llm = llm.bind_tools(tools)

memory = MemorySaver()

class State(TypedDict):
    messages: Annotated[List, add_messages]

# async def model(state: State) -> AsyncIterator[dict]:
#     full_message = None

#     async for chunk in llm.astream(state["messages"]):

#         # Merge chunks
#         if full_message is None:
#             full_message = chunk
#         else:
#             full_message += chunk   # IMPORTANT

#         # Stream chunk to UI
#         yield {"messages": [chunk]}
async def model(state: State) -> dict:
    # Await the ainvoke method, which will still emit streaming events internally
    # when the graph is executed with graph.astream_events()
    response = await llm.ainvoke(state["messages"])
    return {"messages": [response]}


async def tool_route(state: State):
    last_message = state["messages"][-1]

    if hasattr(last_message, "tool_calls") and len(last_message.tool_calls) > 0:
        return "tool"
    else:
        return "end"
    
graph_builder = StateGraph(State)    

graph_builder.add_node("model", model)
graph_builder.add_node("tool_node", ToolNode(tools))

graph_builder.set_entry_point("model")
graph_builder.add_conditional_edges("model", tool_route,
                            {
                                "tool": "tool_node",
                                "end": END
                            })
graph_builder.add_edge("tool_node", "model")

graph = graph_builder.compile(checkpointer=memory)




app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://answergenei.onrender.com",  # Your frontend URL
        "http://localhost:3000",  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def serialise_ai_message_chunk(chunk): 
    # Accept either an AIMessageChunk or a dict containing a 'messages' list
    if isinstance(chunk, AIMessageChunk):
        return chunk.content

    # Accept dictionary shapes produced by graph.astream_events
    if isinstance(chunk, dict):
        # chunk may be {'messages': [AIMessageChunk(...), ...]} or
        # {'model': {'messages': [...]}} in some event shapes
        msgs = None
        if "messages" in chunk and isinstance(chunk["messages"], list):
            msgs = chunk["messages"]
        elif "model" in chunk and isinstance(chunk["model"], dict) and "messages" in chunk["model"]:
            msgs = chunk["model"]["messages"]

        if msgs and len(msgs) > 0:
            last = msgs[-1]
            # last may be AIMessageChunk or a dict with 'content'
            if isinstance(last, AIMessageChunk):
                return last.content
            if isinstance(last, dict) and "content" in last:
                return last["content"]

    # Fallback: return empty string rather than raising to keep stream alive
    return ""

async def generate_chat_responses(message: str, checkpoint_id: Optional[str] = None):
    is_new_conversation = checkpoint_id is None
    # Track last sent content and last search query to avoid duplicates
    last_content_sent = None
    last_search_query = None
    
    if is_new_conversation:
        # Generate new checkpoint ID for first message in conversation
        new_checkpoint_id = str(uuid4())

        config = {
            "configurable": {
                "thread_id": new_checkpoint_id
            }
        }
        
        # Initialize with first message
        events = graph.astream_events(
            {"messages": [HumanMessage(content=message)]},
            version="v2",
            config=config
        )
        
        # First send the checkpoint ID
        checkpoint_data = json.dumps({"type": "checkpoint", "checkpoint_id": new_checkpoint_id})
        yield f"data: {checkpoint_data}\n\n"
    else:
        config = {
            "configurable": {
                "thread_id": checkpoint_id
            }
        }
        # Continue existing conversation
        events = graph.astream_events(
            {"messages": [HumanMessage(content=message)]},
            version="v2",
            config=config
        )

    async for event in events:
        event_type = event["event"]
        # if event_type == "on_chain_stream" and event.get("name") == "model":
        if event_type == "on_chat_model_stream":
            try:
                chunk = event["data"].get("chunk") if isinstance(event.get("data"), dict) else None
                chunk_content = serialise_ai_message_chunk(chunk)
                # Ensure chunk_content is a string
                if chunk_content is None:
                    chunk_content = ""
                # Use json.dumps to properly escape content
                safe_content = str(chunk_content)
                # Avoid sending the exact same content twice in a row
                if safe_content and safe_content != last_content_sent:
                    last_content_sent = safe_content
                    content_data = json.dumps({"type": "content", "content": safe_content})
                    yield f"data: {content_data}\n\n"
            except Exception:
                # Don't crash the stream if serialization fails
                pass
            
        elif event_type == "on_chain_end" and event.get("name") == "model":
            # Check if there are tool calls for search
            try:
                output = event["data"]["output"]
                if isinstance(output, dict) and "messages" in output:
                    messages = output["messages"]
                    if messages:
                        last_msg = messages[-1]
                        # Get tool calls from the message
                        tool_calls = last_msg.tool_calls if hasattr(last_msg, "tool_calls") else []
                        # Check for tavily_search tool calls
                        search_calls = [call for call in tool_calls if call.get("name") == "tavily_search"]
                        
                        if search_calls:
                            # Signal that a search is starting (dedupe repeated identical queries)
                            search_query = search_calls[0].get("args", {}).get("query", "")
                            if search_query and search_query != last_search_query:
                                last_search_query = search_query
                                # Use json.dumps to properly escape query
                                search_data = json.dumps({"type": "search_start", "query": search_query})
                                yield f"data: {search_data}\n\n"
            except (KeyError, IndexError, AttributeError, TypeError):
                pass
                
        elif event_type == "on_tool_end" and event.get("name") == "tavily_search":
            # Search completed - send results or error
            output = event["data"].get("output") if isinstance(event.get("data"), dict) else None

            urls = []
            # Case 1: tool returns a list of result dicts directly
            if isinstance(output, list):
                for item in output:
                    if isinstance(item, dict) and "url" in item:
                        urls.append(item["url"])

            # Case 2: tool returns a ToolMessage-like object or dict with 'content' JSON
            elif hasattr(output, "content") or (isinstance(output, dict) and "content" in output):
                try:
                    raw = output.content if hasattr(output, "content") else output.get("content")
                    parsed = json.loads(raw)
                    # parsed may contain 'results' list
                    results = parsed.get("results") if isinstance(parsed, dict) else None
                    if results and isinstance(results, list):
                        for item in results:
                            if isinstance(item, dict) and "url" in item:
                                urls.append(item["url"])
                except Exception:
                    # fall through if parsing fails
                    pass

            if urls:
                search_results_data = json.dumps({"type": "search_results", "urls": urls})
                yield f"data: {search_results_data}\n\n"
    
    # Send an end event
    end_data = json.dumps({"type": "end"})
    yield f"data: {end_data}\n\n"

@app.get("/chat_stream/{message}")
async def chat_stream(message:str, checkpoint_id: Optional[str] = Query(None)):
    return StreamingResponse(
        generate_chat_responses(message, checkpoint_id),
        media_type="text/event-stream",
    )
