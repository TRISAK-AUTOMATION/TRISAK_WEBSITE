import { useState } from "react";
import { api } from "../api/client.js";
import { isVideoUrl } from "./HeroBgMedia.jsx";

/**
 * Controlled image field: shows the current image (by URL) with Change/
 * Remove buttons, or a dropzone-style file picker when empty. Uploading
 * happens immediately on file selection — onChange receives the server
 * URL once the upload succeeds.
 *
 * Pass `hidePreview` when a separate preview (e.g. a drag-to-position
 * crop frame) is rendered alongside this field, so the image isn't
 * shown twice.
 *
 * Optional client-side checks (the server enforces its own limits either
 * way): `accept` is a comma-separated list of MIME types, e.g.
 * "image/jpeg,image/png,image/webp", and `maxSizeMB` a size cap. Without
 * them the field behaves exactly as before.
 */
export default function ImageUploadField({
  value,
  onChange,
  hidePreview = false,
  accept = "image/*",
  maxSizeMB = null,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    const allowed = accept.split(",").map((t) => t.trim());
    const typeOk = allowed.some((t) => t === file.type || (t.endsWith("/*") && file.type.startsWith(t.slice(0, -1))));
    if (!typeOk) {
      setError(`Unsupported file type. Allowed: ${accept.split(",").map((t) => t.split("/")[1].replace("svg+xml", "svg")).join(", ")}.`);
      return;
    }
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      setError(`The file is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${maxSizeMB} MB.`);
      return;
    }

    setUploading(true);
    setError("");
    try {
      const { url } = await api.adminUploadImage(file);
      onChange(url);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <div className="image-upload image-upload--filled">
        {!hidePreview &&
          (isVideoUrl(value) ? (
            <video src={value} className="image-upload__preview" muted loop autoPlay playsInline />
          ) : (
            <img src={value} alt="" className="image-upload__preview" />
          ))}
        <div className="image-upload__actions">
          <label className={`btn ${uploading ? "is-uploading" : ""}`}>
            {uploading ? "Uploading…" : "Change image"}
            <input type="file" accept={accept} onChange={handleFile} disabled={uploading} hidden />
          </label>
          <button type="button" className="btn" onClick={() => onChange("")} disabled={uploading}>
            Remove
          </button>
        </div>
        {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="image-upload">
      <label className={`image-upload__dropzone ${uploading ? "is-uploading" : ""}`}>
        {uploading ? "Uploading…" : "Click to upload image"}
        <input type="file" accept={accept} onChange={handleFile} disabled={uploading} hidden />
      </label>
      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
    </div>
  );
}
