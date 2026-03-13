"use client";

import React, { useState } from "react";

interface ChatInputProps {
    onSubmit?: (message: string) => void;
}

export default function ChatInput({ onSubmit }: ChatInputProps) {
    const [message, setMessage] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        if (onSubmit) {
            onSubmit(message.trim());
        }

        setMessage("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black pt-6 pb-6 sm:pb-8">
            <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
                <form
                    onSubmit={handleSubmit}
                    className="relative flex items-end w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white/50 shadow-sm backdrop-blur transition-all focus-within:border-zinc-300 focus-within:ring-1 focus-within:ring-zinc-300 dark:border-zinc-800 dark:bg-black/50 dark:focus-within:border-zinc-700 dark:focus-within:ring-zinc-700"
                >
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask AnswerGenei anything..."
                        className="max-h-52 min-h-[56px] w-full resize-none border-0 bg-transparent py-[18px] pl-5 pr-14 text-base focus:outline-none focus:ring-0 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                        rows={1}
                    />
                    <div className="absolute right-2 bottom-2">
                        <button
                            type="submit"
                            disabled={!message.trim()}
                            className="flex h-10 w-10 items-center justify-center rounded-xl transition-all disabled:opacity-40 disabled:hover:scale-100 hover:scale-105 active:scale-95"
                            style={{
                                background: message.trim()
                                    ? "linear-gradient(to bottom right, #1a84b2ff, #0ccbe8ff)"
                                    : "var(--color-zinc-200, #e5e7eb)",
                                color: message.trim() ? "white" : "var(--color-zinc-400, #9ca3af)",
                            }}
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </form>
                <div className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-500">
                    AnswerGenei can make mistakes. Check important info.
                </div>
            </div>
        </div>
    );
}
