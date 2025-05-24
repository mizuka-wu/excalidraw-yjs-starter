import { useEffect, useState } from "react";
import * as Y from "yjs";
import { ExcalidrawBinding } from "y-excalidraw";
import { Awareness } from "y-protocols/awareness";

import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";
import { SocketIOProvider } from "y-socket.io";
import type { RefObject } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

interface CollabOptions {
  id?: string;
  isUseIndexedDb?: boolean;
}

export const useCollab = (
  excalidrawRef: RefObject<HTMLElement | null>,
  options: CollabOptions = {}
) => {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [binding, setBinding] = useState<ExcalidrawBinding | null>(null);

  const id = options.id ?? "";
  const isUseIndexedDb = options.isUseIndexedDb ?? false;

  useEffect(() => {
    if (!api) return;

    const ydoc = new Y.Doc();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const yElements = ydoc.getArray<Y.Map<any>>("elements"); // structure = {el: NonDeletedExcalidrawElement, pos: string}
    const yAssets = ydoc.getMap("assets");

    const isLocalMode = !id;

    const webRTCProvider = isLocalMode
      ? new WebrtcProvider(`excalidraw-local`, ydoc, {
          signaling: [],
        })
      : null;

    const indexeddbPersistence =
      isUseIndexedDb || isLocalMode
        ? new IndexeddbPersistence(`excalidraw-${id || "default"}`, ydoc)
        : null;

    const url = `${location.protocol}//${location.host}`;
    const socketIoProvider = id
      ? new SocketIOProvider(url, `${id}`, ydoc, {})
      : null;

    const undoManagerOptions = !!(
      excalidrawRef.current &&
      excalidrawRef.current.querySelector(".undo-redo-buttons")
    )
      ? {
          excalidrawDom: excalidrawRef.current,
          undoManager: new Y.UndoManager(yElements),
        }
      : undefined;

    const awareness: Awareness =
      socketIoProvider?.awareness ||
      webRTCProvider?.awareness ||
      new Awareness(ydoc);

    const binding = new ExcalidrawBinding(
      yElements,
      yAssets,
      api,
      awareness,
      undoManagerOptions
    );

    const originDestroy = binding.destroy;
    binding.destroy = () => {
      originDestroy.call(binding);
      webRTCProvider?.destroy();
      indexeddbPersistence?.destroy();
      socketIoProvider?.destroy();
    };

    setBinding(binding);
    return () => {
      setBinding(null);
      binding.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, excalidrawRef]);

  return {
    setApi,
    binding,
    excalidrawRef,
  };
};
