import { ChatContainer } from '@/components/chat/ChatContainer';

export default function Home() {
  return (
    <main className="h-screen" style={{ background: 'var(--bg)' }}>
      <ChatContainer />
    </main>
  );
}
