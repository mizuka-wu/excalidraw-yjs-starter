import { useEffect, useState } from "react";
// import { IndexeddbPersistence } from "y-indexeddb";
// import { SocketIOProvider } from "y-socket.io";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

export const useCollab = () => {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  useEffect(() => {
    if (!api) return;
  }, [api]);

  return setApi;
};
