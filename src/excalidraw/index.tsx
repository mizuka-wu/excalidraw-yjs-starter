"use client";
import { FC, useRef } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

import { useCollab } from "./collab";

const ExcalidrawWrapper: FC<{
  id?: string;
  isUseIndexedDb?: boolean;
}> = ({ id, isUseIndexedDb }) => {
  const excalidrawRef = useRef(null);
  const { setApi, binding } = useCollab(excalidrawRef, { id, isUseIndexedDb });
  return (
    <div ref={excalidrawRef} style={{ height: "100vh", width: "100vw" }}>
      <Excalidraw
        excalidrawAPI={setApi}
        isCollaborating={!!binding}
        onPointerUpdate={binding?.onPointerUpdate}
      />
    </div>
  );
};
export default ExcalidrawWrapper;
