/**
 * minio的相关接口
 */
import * as Minio from "minio";
import { Readable } from "stream";
import { type NextRequest } from "next/server";

const isStoreApiEnable = process.env.NEXT_PUBLIC_USE_STORE === "true";

const bucket = process.env.MINIO_BUCKET;
const minioClient =
  isStoreApiEnable && process.env.MINIO_ENDPOINT
    ? new Minio.Client({
        endPoint: process.env.MINIO_ENDPOINT,
        port: Number(process.env.MINIO_PORT),
        useSSL: process.env.MINIO_USE_SSL === "true",
        accessKey: process.env.MINIO_ACCESS_KEY,
        secretKey: process.env.MINIO_SECRET_KEY,
      })
    : null;

/**
 * 获取MinIO服务状态或文件临时链接
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");
  const raw = searchParams.get("raw") === "true";

  // 如果没有提供file参数，直接报错
  if (!file) {
    return Response.json({ error: "缺少必要参数: file" }, { status: 400 });
  }

  // 检查MinIO客户端是否可用
  if (!minioClient || !bucket) {
    return Response.json({ error: "MinIO服务未配置或不可用" }, { status: 503 });
  }

  try {
    // 生成临时链接（有效期1小时）
    const presignedUrl = await minioClient.presignedGetObject(
      bucket,
      file,
      60 * 60 // 1小时有效期（秒）
    );

    // 如果raw=true，返回文件流，否则返回临时链接
    if (raw) {
      // 获取文件流
      const fileStream = await minioClient.getObject(bucket, file);

      // 返回文件流
      return new Response(fileStream as unknown as ReadableStream);
    } else {
      // 返回临时链接
      return Response.json({
        url: presignedUrl,
      });
    }
  } catch (error: Error | unknown) {
    console.error("获取文件失败:", error);
    return Response.json(
      {
        error: `获取文件失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      },
      { status: 404 }
    );
  }
}

/**
 * 上传文件到MinIO存储
 */
export async function POST(request: NextRequest) {
  // 检查MinIO客户端是否可用
  if (!minioClient || !bucket) {
    return Response.json({ error: "MinIO服务未配置或不可用" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { file, key } = body;

    if (!file || !key) {
      return Response.json(
        { error: "缺少必要参数: file 或 key" },
        { status: 400 }
      );
    }

    // 将Base64编码的文件内容转换为Buffer
    const fileBuffer = Buffer.from(
      file.split(",")[1] || file, // 处理可能的Data URL格式
      "base64"
    );

    // 创建可读流
    const fileStream = Readable.from(fileBuffer);

    // 上传文件到MinIO
    await minioClient.putObject(bucket, key, fileStream, fileBuffer.length);

    return Response.json({
      success: true,
      message: "文件上传成功",
      key: key,
    });
  } catch (error: Error | unknown) {
    console.error("上传文件失败:", error);
    return Response.json(
      {
        success: false,
        error: `上传文件失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      },
      { status: 500 }
    );
  }
}
