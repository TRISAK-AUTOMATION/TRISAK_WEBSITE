import { useState } from "react";
import { api } from "../api/client.js";

/**
 * Controlled image field: shows the current image (by URL) with a Remove
 * button, or a dropzone-style file picker when empty. Uploading happens
 * immediately on file selection — onChange receives the server URL once
 * the upload succeeds.
 */
export default function ImageUploadField({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

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
        <img src={value} alt="" className="image-upload__preview" />
        <button type="button" className="btn" onClick={() => onChange("")}>
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="image-upload">
      <label className={`image-upload__dropzone ${uploading ? "is-uploading" : ""}`}>
        {uploading ? "Uploading…" : "Click to upload image"}
        <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} hidden />
      </label>
      {error && <p className="contact-form__status contact-form__status--error">{error}</p>}
    </div>
  );
}
