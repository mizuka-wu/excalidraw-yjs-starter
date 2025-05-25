import { useEffect, useState } from "react";

import type {
  ExcalidrawImperativeAPI,
  BinaryFileData,
} from "@excalidraw/excalidraw/types";

const apiBase = "/api";

class ResourceManager {
  api: ExcalidrawImperativeAPI;
  processedFiles = new Set<string>();
  processingFiles = new Set<string>();

  constructor(api: ExcalidrawImperativeAPI) {
    this.api = api;
  }

  async getFiles(fileIds: string[]) {
    const needProcessFileIds = fileIds.filter((id) => {
      return !this.processedFiles.has(id) && !this.processingFiles.has(id);
    });

    if (needProcessFileIds.length) {
      needProcessFileIds.forEach((id) => {
        this.processingFiles.add(id);
      });

      try {
        const results = await Promise.allSettled(
          needProcessFileIds.map((id) => {
            return id;
          })
        );

        const processedFiles: BinaryFileData[] = [];
        results.forEach((result, index) => {
          const id = needProcessFileIds[index]!;
          if (result.status === "rejected") {
            this.processingFiles.delete(id);
          } else {
            this.processedFiles.add(id);

            processedFiles.push({
              id,
              dataURL: "",
              // generate by filename
              mimeType: "image/png",
              created: Date.now(),
            } as BinaryFileData);
          }
        });

        if (processedFiles.length) {
          this.api.addFiles(processedFiles);
        }
      } catch (e: unknown) {
        console.error(e);
        needProcessFileIds.forEach((id) => {
          this.processingFiles.delete(id);
        });
      }
    }
  }

  async generateIdForFile(file: File) {
    /**
     * 支持上传
     */
    fetch(apiBase, {
      method: "POST",
    });

    return file.name;
  }
}

export const useStore = () => {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [resourceManager, setResourceManager] =
    useState<ResourceManager | null>(null);

  useEffect(() => {
    if (!api) return;

    const resourceManager = new ResourceManager(api);
    setResourceManager(resourceManager);

    api.onChange((elements) => {
      const neddProcessFileIds: string[] = elements
        .filter((element) => {
          if (element.isDeleted) return false;
          if (Reflect.has(element, "fileId")) {
            const fileId = Reflect.get(element, "fileId") as string;

            return (
              !resourceManager.processedFiles.has(fileId) &&
              !resourceManager.processingFiles.has(fileId)
            );
          }
          return false;
        })
        .map((element) => {
          return Reflect.get(element, "fileId") as string;
        });
      if (neddProcessFileIds.length) {
        resourceManager.getFiles(neddProcessFileIds);
      }
    });

    return () => {
      setResourceManager(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  return {
    setApi,
    resourceManager,
  };
};
