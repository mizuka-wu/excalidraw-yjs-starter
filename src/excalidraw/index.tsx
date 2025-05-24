"use client";
import { FC } from 'react'
import { Excalidraw } from "@excalidraw/excalidraw";

import "@excalidraw/excalidraw/index.css";

const ExcalidrawWrapper: FC = () => {
  return (
    <div style={{height: "100vh", width: "100vw"}}>
      <Excalidraw />
    </div>
  );
};
export default ExcalidrawWrapper;

