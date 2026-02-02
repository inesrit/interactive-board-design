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
          name: undefined,
        }}
        initialStorage={{
          stickies: new LiveList([]),
          ideas: new LiveList([]),
          actions: new LiveList([]),
          preDiscoveryBoxes: new LiveList([
            new LiveObject({ id: "box-1", text: "Gather requirements from stakeholders" }),
            new LiveObject({ id: "box-2", text: "Create technical design document" }),
            new LiveObject({ id: "box-3", text: "Implement code and unit tests" }),
            new LiveObject({ id: "box-4", text: "Submit PR for team review" }),
            new LiveObject({ id: "box-5", text: "Deploy to production after approval" }),
          ]),
          preDiscoveryOrder: new LiveList([]),
          stageVotes: new LiveList([
            { id: "refinement", agree: 0, disagree: 0, agreedBy: [], disagreedBy: [] },
            { id: "investigation", agree: 0, disagree: 0, agreedBy: [], disagreedBy: [] },
            { id: "kickoff", agree: 0, disagree: 0, agreedBy: [], disagreedBy: [] },
            { id: "pr-reviews", agree: 0, disagree: 0, agreedBy: [], disagreedBy: [] },
            { id: "ux-reviews", agree: 0, disagree: 0, agreedBy: [], disagreedBy: [] },
            { id: "technical-reviews", agree: 0, disagree: 0, agreedBy: [], disagreedBy: [] },
            { id: "manual-testing", agree: 0, disagree: 0, agreedBy: [], disagreedBy: [] },
            { id: "documentation", agree: 0, disagree: 0, agreedBy: [], disagreedBy: [] },
          ].map(stage => new LiveObject(stage))),
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
