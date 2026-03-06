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

llm = ChatGroq(model="llama-3.1-8b-instant",temperature=0,)
llm = llm.bind_tools(tools)

memory = MemorySaver()

class State(TypedDict):
    messages: Annotated[List, add_messages]

async def model(state: State) -> AsyncIterator[dict]:
    full_message = None

    async for chunk in llm.astream(state["messages"]):

        # Merge chunks
        if full_message is None:
            full_message = chunk
        else:
            full_message += chunk   # IMPORTANT

        # Stream chunk to UI
        yield {"messages": [chunk]}

    # After streaming completes,
    # yield the FULL accumulated message
    if full_message:
        yield {"messages": [full_message]}

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




