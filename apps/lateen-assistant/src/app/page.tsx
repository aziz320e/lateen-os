import { Suspense } from 'react';
import { ChatPanel } from '@/components/chat/chat-panel';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChatPage() {
  return (
    <Suspense fallback={<Skeleton className="h-full m-6" />}>
      <ChatPanel />
    </Suspense>
  );
}
