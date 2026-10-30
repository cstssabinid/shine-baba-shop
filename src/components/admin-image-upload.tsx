"use client";

import { useId, useState } from "react";
import type { ChangeEvent } from "react";

const maxImageSize = 4 * 1024 * 1024;
const maxProductImages = 8;
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
  defaultValues?: string[];
};

export function AdminImageUpload({ defaultValue = "", defaultValues }: AdminImageUploadProps) {
  const imageId = useId();
  const fileId = useId();
  const [images, setImages] = useState(() => {
    const initialImages = defaultValues?.length ? defaultValues : defaultValue ? [defaultValue] : [""];
    return initialImages.slice(0, maxProductImages);
  });
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [hasError, setHasError] = useState(false);

  function updateImage(index: number, value: string) {
    setImages((current) => current.map((image, currentIndex) => currentIndex === index ? value : image));
    setStatus("");
    setHasError(false);
  }

  function addImageField() {
    if (images.length >= maxProductImages) {
      setHasError(true);
      setStatus(`A product can have up to ${maxProductImages} images.`);
      return;
    }
    setImages((current) => [...current, ""]);
    setStatus("");
  }

  function removeImage(index: number) {
    if (images.length <= 1) return;
    setImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setStatus("");
    setHasError(false);
  }

  async function uploadImages(event: ChangeEvent<HTMLInputElement>) {
    const fileInput = event.currentTarget;
    const files = Array.from(fileInput.files ?? []);
    if (!files.length) return;

    const addedSlots = Math.max(0, files.length - images.filter((image) => !image.trim()).length);
    if (images.length + addedSlots > maxProductImages) {
      setHasError(true);
      setStatus(`A product can have up to ${maxProductImages} images.`);
      fileInput.value = "";
      return;
    }

    const invalidFile = files.find((file) => !supportedImageTypes.includes(file.type) || file.size === 0 || file.size > maxImageSize);
    if (invalidFile) {
      setHasError(true);
      setStatus(!supportedImageTypes.includes(invalidFile.type)
        ? "Choose JPEG, PNG, or WebP images."
        : "Each image must be smaller than 4 MB.");
      fileInput.value = "";
      return;
    }

    setUploading(true);
    setHasError(false);
    const uploaded: string[] = [];
    let uploadError = "";

    try {
      for (const [index, file] of files.entries()) {
        setStatus(`Uploading image ${index + 1} of ${files.length}…`);
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/admin/api/product-image", { method: "POST", body: formData });
        const result = await response.json() as { url?: unknown; error?: unknown };
        if (!response.ok || typeof result.url !== "string") {
          throw new Error(typeof result.error === "string" ? result.error : `Could not upload ${file.name}.`);
        }
        uploaded.push(result.url);
      }
    } catch (error) {
      uploadError = error instanceof Error ? error.message : "An image could not be uploaded. Please retry.";
    } finally {
      if (uploaded.length) {
        setImages((current) => {
          const next = [...current];
          for (const url of uploaded) {
            const emptyIndex = next.findIndex((image) => !image.trim());
            if (emptyIndex >= 0) next[emptyIndex] = url;
            else next.push(url);
          }
          return next;
        });
      }
      setUploading(false);
      fileInput.value = "";
    }

    setHasError(Boolean(uploadError));
    setStatus(uploadError || (uploaded.length ? `${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded. Save the product to attach them.` : ""));
  }

  return (
    <div className="manager-image-upload manager-field-wide">
      <div className="manager-image-list">
        {images.map((image, index) => (
          <div className="manager-image-item" key={`${imageId}-${index}`}>
            <label htmlFor={`${imageId}-${index}`}>
              Product image {index + 1}
              <input
                id={`${imageId}-${index}`}
                name="images"
                type="text"
                value={image}
                onChange={(event) => updateImage(index, event.currentTarget.value)}
                required
                maxLength={2048}
                placeholder="/images/products/item.png or HTTPS URL"
              />
              {image && isSafeImageLink(image) && <a className="manager-image-preview-link" href={image} target="_blank" rel="noreferrer">Open image {index + 1} ↗</a>}
            </label>
            {images.length > 1 && <button className="text-button manager-remove-image" type="button" disabled={uploading} onClick={() => removeImage(index)}>Remove image</button>}
          </div>
        ))}
      </div>
      <div className="manager-image-actions">
        <button className="text-button" type="button" disabled={uploading || images.length >= maxProductImages} onClick={addImageField}>Add image URL</button>
        <label htmlFor={fileId}>
          {uploading ? "Uploading images…" : "Choose images from device"}
          <input
            id={fileId}
            className="manager-image-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading || images.filter((image) => image.trim()).length >= maxProductImages}
            onChange={uploadImages}
          />
          <small>JPEG, PNG, or WebP · up to {maxProductImages} images · maximum 4 MB each.</small>
        </label>
      </div>
      <p className="manager-image-upload-status" data-error={hasError} role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
