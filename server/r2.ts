import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID!;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const BUCKET = process.env.R2_BUCKET || "dinobane-vault";
const PUBLIC_URL = process.env.R2_PUBLIC_URL!; // e.g. https://pub-xxx.r2.dev

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return client;
}

export function r2Available(): boolean {
  return !!(ACCOUNT_ID && ACCESS_KEY && SECRET_KEY && PUBLIC_URL);
}

export async function uploadToR2(
  dataUrl: string,
  type: "image" | "video",
  originalName: string
): Promise<string> {
  const s3 = getClient();

  // Convert base64 dataUrl to buffer
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid dataUrl format");
  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], "base64");

  // Generate unique key
  const ext = originalName.split(".").pop() || (type === "image" ? "jpg" : "mp4");
  const key = `vault/${type}s/${randomUUID()}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    CacheControl: "public, max-age=31536000",
  }));

  return `${PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(url: string): Promise<void> {
  if (!url || !url.startsWith("http")) return;
  const s3 = getClient();
  // Extract key from URL
  const publicUrl = process.env.R2_PUBLIC_URL || "";
  const key = url.replace(publicUrl + "/", "");
  if (!key || key === url) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (e) {
    console.warn("[r2] delete failed:", e);
  }
}
