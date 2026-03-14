"use client";

import React, { useState, useRef, useEffect } from "react";
import ChatInput from "../components/ChatInput";
import ChatMessage, { Message } from "../components/ChatMessage";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [checkpointId, setCheckpointId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      isLoading: true
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setIsGenerating(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL
      // console.log(API_URL)
      const url = new URL(`${API_URL}/chat_stream/${encodeURIComponent(content)}`);
      // console.log(url)
      if (checkpointId) {
        url.searchParams.append("checkpoint_id", checkpointId);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errText}`);
      }
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: true });

          let marker;
          while ((marker = buffer.indexOf("\n\n")) !== -1) {
            const eventStr = buffer.slice(0, marker);
            buffer = buffer.slice(marker + 2);

            if (eventStr.startsWith("data: ")) {
              const dataStr = eventStr.substring(6);
              try {
                const data = JSON.parse(dataStr);

                if (data.type === "checkpoint") {
                  setCheckpointId(data.checkpoint_id);
                } else if (data.type === "content") {
                  setMessages((prev) => prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: msg.content + data.content, isLoading: false }
                      : msg
                  ));
                } else if (data.type === "search_start") {
                  setMessages((prev) => prev.map((msg) => {
                    if (msg.id === aiMessageId) {
                      const newSearches = [...(msg.searches || []), { query: data.query }];
                      return { ...msg, searches: newSearches, isLoading: false };
                    }
                    return msg;
                  }));
                } else if (data.type === "search_results") {
                  setMessages((prev) => prev.map((msg) => {
                    if (msg.id === aiMessageId) {
                      const searches = [...(msg.searches || [])];
                      if (searches.length > 0) {
                        searches[searches.length - 1] = {
                          ...searches[searches.length - 1],
                          urls: data.urls || []
                        };
                      }
                      return { ...msg, searches, isLoading: false };
                    }
                    return msg;
                  }));
                }
              } catch (err) {
                console.error("JSON parse error on payload:", dataStr, err);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
      setMessages((prev) => prev.map((msg) =>
        msg.id === aiMessageId ? { ...msg, content: "Error connecting to the server.", isLoading: false } : msg
      ));
    } finally {
      setIsGenerating(false);
      setMessages((prev) => prev.map((msg) =>
        msg.id === aiMessageId && msg.isLoading ? { ...msg, isLoading: false } : msg
      ));
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center pb-40 pt-4">
      <div className="w-full max-w-5xl flex-1 px-4 sm:px-6">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[50vh] flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              How can I help you today?
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              Ask me anything to get started.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Sticky Input Area */}
      <ChatInput onSubmit={handleSendMessage} />
    </main>
  );
}
