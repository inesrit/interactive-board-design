import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import RetroBoard from "./app/RetroBoard.tsx";
import "./styles/index.css";
import { Room } from "./app/components/Room";
import { ReleaseRetroRoom } from "./app/components/retro/ReleaseRetroRoom.tsx";

// Simple path-based routing without an external router dependency
const path = window.location.pathname;
const isRetroBoard = path === "/retro" || path === "/retro/";

createRoot(document.getElementById("root")!).render(
  isRetroBoard ? (
    <ReleaseRetroRoom>
      <RetroBoard />
    </ReleaseRetroRoom>
  ) : (
    <Room>
      <App />
    </Room>
  )
);
