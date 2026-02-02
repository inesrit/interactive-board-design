// Define Liveblocks types for your application
import type { LiveList, LiveObject } from "@liveblocks/client";

declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      cursor: { x: number; y: number } | null;
      name?: string;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      stickies: LiveList<LiveObject<{
        id: string;
        content: string;
        x: number;
        y: number;
        color: string;
        userName: string;
      }>>;
      ideas: LiveList<LiveObject<{
        id: string;
        text: string;
        agree: number;
        disagree: number;
        author: string;
        agreedBy: string[];
        disagreedBy: string[];
      }>>;
      actions: LiveList<LiveObject<{
        id: string;
        text: string;
        completed: boolean;
      }>>;
      preDiscoveryBoxes: LiveList<LiveObject<{
        id: string;
        text: string;
      }>>;
      preDiscoveryOrder: LiveList<string>;
      stageVotes: LiveList<LiveObject<{
        id: string;
        agree: number;
        disagree: number;
        agreedBy: string[];
        disagreedBy: string[];
      }>>;
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id?: string;
      info?: {
        name?: string;
        avatar?: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: {};

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {};

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: {};
  }
}

export {};
