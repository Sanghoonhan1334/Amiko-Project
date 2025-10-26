import ChatRoomClient from '@/components/main/app/community/ChatRoomClient'

export default async function ChatRoomPage({
  params
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = await params
  return <ChatRoomClient roomId={roomId} />
}
