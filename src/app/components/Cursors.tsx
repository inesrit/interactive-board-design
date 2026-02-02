import { useOthers, useUpdateMyPresence } from "@liveblocks/react/suspense";
import { MousePointer2 } from "lucide-react";
import { useEffect } from "react";

export function Cursors() {
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      updateMyPresence({
        cursor: {
          x: e.clientX,
          y: e.clientY,
        },
      });
    };

    const handlePointerLeave = () => {
      updateMyPresence({
        cursor: null,
      });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [updateMyPresence]);

  return (
    <>
      {others.map(({ connectionId, presence }) => {
        if (!presence.cursor) {
          return null;
        }

        const cursor = presence.cursor as { x: number; y: number };
        const userName = (presence.name as string | undefined) || `User ${connectionId.toString().slice(0, 4)}`;

        return (
          <div
            key={connectionId}
            className="absolute pointer-events-none z-50"
            style={{
              transform: `translate(${cursor.x}px, ${cursor.y}px)`,
            }}
          >
            <MousePointer2
              className="w-5 h-5"
              style={{
                fill: getColorForConnection(connectionId),
                color: getColorForConnection(connectionId),
              }}
            />
            <div
              className="px-2 py-1 text-xs text-white rounded-md ml-5 -mt-1 whitespace-nowrap"
              style={{
                backgroundColor: getColorForConnection(connectionId),
              }}
            >
              {userName}
            </div>
          </div>
        );
      })}
    </>
  );
}

// Generate a consistent color for each connection
function getColorForConnection(connectionId: number): string {
  const colors = [
    "#DC2626", // red
    "#2563EB", // blue
    "#16A34A", // green
    "#9333EA", // purple
    "#EA580C", // orange
    "#0891B2", // cyan
    "#DB2777", // pink
    "#65A30D", // lime
  ];
  return colors[connectionId % colors.length];
}
