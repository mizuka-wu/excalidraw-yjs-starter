/**
 * minio的相关接口
 */
import * as Minio from "minio";

import { type NextRequest } from "next/server";

const bucket = process.env.MINIO_BUCKET;
const minioClient = process.env.MINIO_ENDPOINT
  ? new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: Number(process.env.MINIO_PORT),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    })
  : null;

export async function GET() {
  return Response.json({
    data: {
      isEnable: !!minioClient,
    },
  });
}
