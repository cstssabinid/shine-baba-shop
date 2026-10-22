"use client";

import { useId, useState } from "react";
import type { ChangeEvent } from "react";

const maxImageSize = 4 * 1024 * 1024;
const supportedImageTypes = ["image/jpeg", "image/png", "image/webp"];

function isSafeImageLink(value: string) {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && !value.split("/").includes("..")) {
    return true;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

type AdminImageUploadProps = {
  defaultValue?: string;
};

export function AdminImageUpload({ defaultValue = "" }: AdminImageUploadProps) {
  const imageId = useId();
  const fileId = useId();
  const [image, setImage] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [hasError, setHasError] = useState(false);

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const fileInput = event.currentTarget;
    const file = fileInput.files?.[0];
    if (!file) return;

    if (!supportedImageTypes.includes(file.type)) {
      setHasError(true);
      setStatus("Choose a JPEG, PNG, or WebP image.");
      fileInput.value = "";
      return;
    }

    if (file.size > maxImageSize) {
      setHasError(true);
      setStatus("Choose an image smaller than 4 MB.");
      fileInput.value = "";
      return;
    }

    setUploading(true);
    setHasError(false);
    setStatus("Uploading image…");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/admin/api/product-image", { method: "POST", body: formData });
      const result = await response.json() as { url?: unknown; error?: unknown };
      if (!response.ok || typeof result.url !== "string") {
        throw new Error(typeof result.error === "string" ? result.error : "The image could not be uploaded. Please retry.");
      }

      setImage(result.url);
      setStatus(`${file.name} uploaded. Save the product to attach it.`);
    } catch (error) {
      setHasError(true);
      setStatus(error instanceof Error ? error.message : "The image could not be uploaded. Please retry.");
    } finally {
      setUploading(false);
      fileInput.value = "";
    }
  }

  return (
    <div className="manager-image-upload manager-field-wide">
      <label htmlFor={imageId}>
        Image path or HTTPS URL
        <input
          id={imageId}
          name="image"
          type="text"
          value={image}
          onChange={(event) => {
            setImage(event.currentTarget.value);
            setStatus("");
            setHasError(false);
          }}
          required
          maxLength={2048}
          placeholder="/images/products/item.png"
        />
        <small>Use a project image path, paste an HTTPS URL, or choose a photo from your device.</small>
      </label>
      <label htmlFor={fileId}>
        {uploading ? "Uploading image…" : "Choose image from device"}
        <input
          id={fileId}
          className="manager-image-file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading}
          onChange={uploadImage}
        />
        <small>JPEG, PNG, or WebP · maximum 4 MB.</small>
      </label>
      <p className="manager-image-upload-status" data-error={hasError} role="status" aria-live="polite">
        {uploading ? "Uploading image…" : status}
      </p>
      {image && isSafeImageLink(image) && (
        <a className="manager-image-preview-link" href={image} target="_blank" rel="noreferrer">
          Open current image ↗
        </a>
      )}
    </div>
  );
}
