import { ReactNode, useState } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { LiveList, LiveObject } from "@liveblocks/client";

export function Room({ children }: { children: ReactNode }) {
  // Extract room ID from URL or generate one
  const [roomId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get("room");

    if (!id) {
      id = generateRoomId();
      const newUrl = `${window.location.pathname}?room=${id}`;
      window.history.replaceState({}, "", newUrl);
    }

    console.log("🔗 Connected to room:", id);
    console.log("📋 Share this URL with others:", window.location.href);
    return id;
  });

  return (
    <LiveblocksProvider 
      publicApiKey="pk_dev_7B8VV7tgrdNoWSnXwEZuMXU_iR3t1SJxCatrzZBq8H6bre8SshRZn2Sr6uDg-blV"
    >
      <RoomProvider 
        id={roomId}
        initialPresence={{
          cursor: null,
        }}
        initialStorage={{
          stickies: new LiveList([]),
          ideas: new LiveList([]),
          actions: new LiveList([]),
          preDiscoveryRows: new LiveList(
            Array.from({ length: 7 }, (_, i) => 
              new LiveObject({
                id: i + 1,
                name: "",
                steps: new LiveList([
                  new LiveObject({ id: `${i + 1}-1`, text: "" })
                ])
              })
            )
          ),
        }}
      >
        <ClientSideSuspense fallback={<div className="flex items-center justify-center h-screen">Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function generateRoomId(): string {
  return `room-${Math.random().toString(36).substring(2, 9)}`;
}
