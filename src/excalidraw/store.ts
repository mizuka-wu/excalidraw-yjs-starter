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
          needProcessFileIds.map(async (id) => {
            // 获取文件并转换为dataURL
            try {
              const response = await fetch(
                `${apiBase}?file=${encodeURIComponent(id)}&raw=true`
              );

              if (!response.ok) {
                throw new Error(`获取文件失败: ${response.status}`);
              }

              // 获取文件内容并转换为Blob
              const blob = await response.blob();

              // 创建DataURL
              return new Promise<{
                id: string;
                dataURL: string;
                mimeType: string;
              }>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  resolve({
                    id,
                    dataURL: reader.result as string,
                    mimeType: this.getMimeTypeFromFileName(id),
                  });
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            } catch (error) {
              console.error(`获取文件 ${id} 失败:`, error);
              throw error;
            }
          })
        );

        const processedFiles: BinaryFileData[] = [];
        results.forEach((result, index) => {
          const id = needProcessFileIds[index]!;
          if (result.status === "rejected") {
            this.processingFiles.delete(id);
          } else {
            this.processedFiles.add(id);

            if (result.status === "fulfilled") {
              const { dataURL, mimeType } = result.value;
              processedFiles.push({
                id,
                dataURL,
                mimeType,
                created: Date.now(),
              } as BinaryFileData);
            }
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

  /**
   * 根据文件名推断 MIME 类型
   */
  getMimeTypeFromFileName(fileName: string): string {
    const extension = fileName.split(".").pop()?.toLowerCase() || "";

    const mimeTypes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      svg: "image/svg+xml",
      webp: "image/webp",
      bmp: "image/bmp",
      ico: "image/x-icon",
      tiff: "image/tiff",
      tif: "image/tiff",
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      mp3: "audio/mpeg",
      mp4: "video/mp4",
      wav: "audio/wav",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      txt: "text/plain",
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      json: "application/json",
      xml: "application/xml",
    };

    return mimeTypes[extension] || "application/octet-stream";
  }

  async generateIdForFile(file: File) {
    /**
     * 支持上传
     */
    try {
      // 读取文件为Base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 生成唯一的文件名
      const timestamp = Date.now();
      const randomPart = Math.random().toString(36).substring(2, 10);
      const extension = file.name.split(".").pop() || "";
      const key = `${timestamp}-${randomPart}${
        extension ? "." + extension : ""
      }`;

      // 上传文件
      const response = await fetch(apiBase, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: base64Data,
          key: key,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "上传失败");
      }

      const result = await response.json();

      if (result.success) {
        return key; // 返回上传成功的文件名
      } else {
        throw new Error(result.error || "上传失败");
      }
    } catch (error) {
      console.error("上传文件失败:", error);
      // 如果上传失败，返回原始文件名
      return file.name;
    }
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
