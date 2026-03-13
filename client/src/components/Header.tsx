import React from 'react';

export default function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    {/* Logo / Bot Icon */}
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
                        style={{ background: 'linear-gradient(to bottom right, #1a84b2ff, #0ccbe8ff)' }}
                    >
                        <svg
                            className="h-6 w-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
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
                    {/* Brand Name */}
                    <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-xl font-bold text-transparent tracking-tight">
                        AnswerGenei
                    </span>
                </div>
            </div>
        </header>
    );
}
