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
  batchSize: number;

  constructor(api: ExcalidrawImperativeAPI, options?: { batchSize?: number }) {
    this.api = api;
    // 批量更新数量，设置为 1 则表示单个完成就更新
    this.batchSize = options?.batchSize ?? 5;
  }

  async getFiles(fileIds: string[]) {
    const needProcessFileIds = fileIds.filter((id) => {
      return !this.processedFiles.has(id) && !this.processingFiles.has(id);
    });

    if (!needProcessFileIds.length) return;

    // 标记为处理中，避免重复请求
    needProcessFileIds.forEach((id) => this.processingFiles.add(id));

    const batch: BinaryFileData[] = [];

    const flush = () => {
      if (batch.length) {
        // 一次性提交当前批次
        const payload = batch.splice(0, batch.length);
        this.api.addFiles(payload);
      }
    };

    const tasks = needProcessFileIds.map(async (id) => {
      try {
        const response = await fetch(
          `${apiBase}?file=${encodeURIComponent(id)}&raw=true`
        );

        if (!response.ok) {
          throw new Error(`获取文件失败: ${response.status}`);
        }

        const blob = await response.blob();

        const { dataURL } = await new Promise<{ dataURL: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ dataURL: reader.result as string });
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        // 成功：更新状态并放入批次
        this.processedFiles.add(id);
        this.processingFiles.delete(id);

        batch.push({
          id,
          dataURL,
          mimeType: this.getMimeTypeFromFileName(id),
          created: Date.now(),
        } as BinaryFileData);

        if (batch.length >= this.batchSize) {
          flush();
        }
      } catch (error) {
        console.error(`获取文件 ${id} 失败:`, error);
        // 失败：仅移除 processing 状态，允许后续重试
        this.processingFiles.delete(id);
      }
    });

    // 所有任务结束后，冲掉尾批
    Promise.allSettled(tasks).then(() => {
      flush();
    });
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
