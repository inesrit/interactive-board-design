
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import { Room } from "./app/components/Room";

  createRoot(document.getElementById("root")!).render(
    <Room>
      <App />
    </Room>
  );
  