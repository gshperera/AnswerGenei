import ChatInput from "../components/ChatInput";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-zinc-50 dark:bg-[#0a0a0a] pb-32">
      {/* Chat interface will go here */}
      <p className="text-zinc-500">Chat messages will appear here.</p>

      {/* Sticky Input Area */}
      <ChatInput />
    </main>
  );
}
