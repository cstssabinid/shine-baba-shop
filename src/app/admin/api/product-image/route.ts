import { put } from "@vercel/blob";
import { hasManagerSession } from "@/lib/admin-auth";

export const runtime = "nodejs";

const maxImageSize = 4 * 1024 * 1024;
const extensionByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function matchesImageSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

  if (type === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((byte, index) => bytes[index] === byte);
  }

  if (type === "image/webp") {
    return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }

  return false;
}

export async function POST(request: Request) {
  if (!await hasManagerSession()) {
    return Response.json({ error: "Sign in as the manager before uploading product images." }, { status: 401 });
  }

  const hasBlobCredentials = Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN),
  );
  if (!hasBlobCredentials) {
    return Response.json(
      { error: "Image storage is not connected. Add a public Vercel Blob store to this project and pull its Development settings." },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Choose an image file and try again." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose an image file and try again." }, { status: 400 });
  }
  if (!extensionByType[file.type]) {
    return Response.json({ error: "Choose a JPEG, PNG, or WebP image." }, { status: 415 });
  }
  if (file.size === 0 || file.size > maxImageSize) {
    return Response.json({ error: "Choose an image smaller than 4 MB." }, { status: 413 });
  }

  const imageHeader = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!matchesImageSignature(file.type, imageHeader)) {
    return Response.json({ error: "The selected file does not match its image type." }, { status: 415 });
  }

  const baseName = file.name
    .replace(/\.[^.]*$/, "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "product-image";

  try {
    const blob = await put(`products/${baseName}.${extensionByType[file.type]}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return Response.json({ url: blob.url });
  } catch {
    return Response.json(
      { error: "Image upload failed. Check that the connected Blob store is public, then retry." },
      { status: 502 },
    );
  }
}
