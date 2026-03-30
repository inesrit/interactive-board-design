import { ReactNode, useState } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { LiveList } from "@liveblocks/client";

export function ReleaseRetroRoom({ children }: { children: ReactNode }) {
  const [roomId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get("room");

    if (!id) {
      id = `retro-${Math.random().toString(36).substring(2, 9)}`;
      const newUrl = `${window.location.pathname}?room=${id}`;
      window.history.replaceState({}, "", newUrl);
    }

    console.log("🔗 Retro board room:", id);
    return id;
  });

  return (
    <LiveblocksProvider publicApiKey="pk_dev_7B8VV7tgrdNoWSnXwEZuMXU_iR3t1SJxCatrzZBq8H6bre8SshRZn2Sr6uDg-blV">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, name: undefined }}
        initialStorage={{
          stickies: new LiveList([]),
          ideas: new LiveList([]),
          actions: new LiveList([]),
          preDiscoveryBoxes: new LiveList([]),
          preDiscoveryOrder: new LiveList([]),
          stageVotes: new LiveList([]),
          retroStickies: new LiveList([]),
          retroCalendarNotes: new LiveList([]),
          retroCalendarImages: new LiveList([]),
          retroCalendarStrokes: new LiveList([]),
          retroProcessVotes: new LiveList([]),
        }}
      >
        <ClientSideSuspense
          fallback={
            <div className="flex items-center justify-center h-screen text-gray-500 text-lg">
              Loading Release Retro Board…
            </div>
          }
        >
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
