"use client";

import React from "react";

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    isLoading?: boolean;
    searches?: { query: string; urls?: string[] }[];
}

interface ChatMessageProps {
    message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === "user";

    return (
        <div className={`flex w-full my-6 ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`flex w-full max-w-[85%] sm:max-w-[75%] gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>

                {/* Avatar */}
                <div className="flex-shrink-0 mt-1">
                    {isUser ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                            <svg className="h-5 w-5 text-zinc-600 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    ) : (
                        <div
                            className="flex h-8 w-8 items-center justify-center rounded-xl shadow-sm"
                            style={{ background: 'linear-gradient(to bottom right, #1a84b2ff, #0ccbe8ff)' }}
                        >
                            <svg
                                className="h-5 w-5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12 8V4H8" />
                                <rect width="16" height="12" x="4" y="8" rx="2" />
                                <path d="M2 14h2" />
                                <path d="M20 14h2" />
                                <path d="M15 13v2" />
                                <path d="M9 13v2" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className={`flex flex-col w-full gap-2 ${isUser ? 'items-end' : 'items-start'}`}>

                    {/* Searches - Rendered OUTSIDE the main answer bubble for the Assistant */}
                    {!isUser && message.searches && message.searches.length > 0 && (
                        <div className="flex flex-col gap-3 mb-1 w-full max-w-2xl">
                            {message.searches.map((search, idx) => (
                                <div key={idx} className="flex flex-col gap-2 rounded-xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm text-left">
                                    <div className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                                        <svg className="h-4 w-4 text-[#0ccbe8ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                        Searching the web for "{search.query}"
                                    </div>

                                    {search.urls && search.urls.length > 0 && (
                                        <div className="flex flex-col gap-2 mt-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                                            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                                Reading {search.urls.length} sources
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {search.urls.map((url, uidx) => {
                                                    try {
                                                        const domain = new URL(url).hostname.replace('www.', '');
                                                        return (
                                                            <a key={uidx} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-[#1a84b2ff] hover:border-[#1a84b2ff] transition-colors truncate max-w-[200px]" title={url}>
                                                                {domain}
                                                            </a>
                                                        );
                                                    } catch {
                                                        return null;
                                                    }
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Answer Label */}
                    {!isUser && message.searches && message.searches.length > 0 && (
                        <div className="text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-[#1a84b2ff] to-[#0ccbe8ff] bg-clip-text text-transparent ml-1 mt-2 mb-1">
                            Answer
                        </div>
                    )}

                    {/* Message Bubble */}
                    {(message.content || message.isLoading || isUser) && (
                        <div
                            className={`flex flex-col rounded-2xl px-5 py-3.5 shadow-sm text-[15px] leading-relaxed flex-shrink-0 w-fit
                                ${isUser
                                    ? "rounded-tr-sm text-white"
                                    : "rounded-tl-sm bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                                }
                            `}
                            style={isUser ? { background: 'linear-gradient(to bottom right, #1a84b2ff, #0ccbe8ff)' } : {}}
                        >
                            {/* Main Content */}
                            {message.content && (
                                <div className="flex flex-col gap-1 w-full overflow-hidden">
                                    {message.content.split('\n').map((line, i) => (
                                        <span key={i} className="block min-h-[1.5rem] break-words">
                                            {line}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Loading Indicator */}
                            {message.isLoading && (!message.content) && (
                                <div className="flex items-center h-6 gap-1.5 px-1 py-1 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-[bounce_1s_infinite_0ms]"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-[bounce_1s_infinite_200ms]"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-[bounce_1s_infinite_400ms]"></div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
