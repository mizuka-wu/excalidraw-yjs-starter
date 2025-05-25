"use client";
import { FC, useRef } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

import { useCollab } from "./collab";
import { useStore } from "./store";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const isStoreApiEnable = process.env.NEXT_PUBLIC_USE_STORE === "true";

const ExcalidrawWrapper: FC<{
  id?: string;
  isUseIndexedDb?: boolean;
}> = ({ id, isUseIndexedDb }) => {
  const excalidrawRef = useRef(null);
  const { setApi: setCollabApi, binding } = useCollab(excalidrawRef, {
    id,
    isUseIndexedDb,
    isStoreApiEnable,
  });

  const { setApi: setStoreApi, resourceManager } = useStore();

  const setApi = (api: ExcalidrawImperativeAPI) => {
    setCollabApi(api);
    if (isStoreApiEnable) setStoreApi(api);
  };

  return (
    <div ref={excalidrawRef} style={{ height: "100vh", width: "100vw" }}>
      <Excalidraw
        excalidrawAPI={setApi}
        isCollaborating={!!binding}
        onPointerUpdate={binding?.onPointerUpdate}
        generateIdForFile={resourceManager?.generateIdForFile}
      />
    </div>
  );
};
export default ExcalidrawWrapper;
