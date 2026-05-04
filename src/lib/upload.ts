const DEFAULT_UPLOAD_API_URL = "http://localhost:5001";

export function getUploadApiBaseUrl(): string {
  const configured = import.meta.env.VITE_UPLOAD_API_URL ?? DEFAULT_UPLOAD_API_URL;
  const trimmed = configured.replace(/\/$/, "");

  if (typeof window === "undefined") return trimmed;

  const uploadUrl = new URL(trimmed, window.location.origin);
  const pageHost = window.location.hostname;
  const uploadHost = uploadUrl.hostname;
  const pageIsLocal = pageHost === "localhost" || pageHost === "127.0.0.1";
  const uploadIsLocal = uploadHost === "localhost" || uploadHost === "127.0.0.1";

  if (!pageIsLocal && uploadIsLocal) {
    uploadUrl.hostname = pageHost;
  }

  return uploadUrl.origin;
}

export function toPlayableUploadUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("blob:") || url.startsWith("data:")) return "";

  if (url.startsWith("/uploads/")) {
    return `${getUploadApiBaseUrl()}${url}`;
  }

  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/uploads/")) {
      return `${getUploadApiBaseUrl()}${parsed.pathname}`;
    }
  } catch {
    return url;
  }

  return url;
}

export async function uploadBlobSimple(blob: Blob, filename: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", blob, filename);

  const res = await fetch(`${getUploadApiBaseUrl()}/api/upload`, {
    method: "POST",
    body: fd,
  });

  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    let text = "";
    try {
      if (contentType.includes("application/json")) {
        const j = await res.json();
        text = j && j.error ? String(j.error) : JSON.stringify(j);
      } else {
        text = await res.text();
      }
    } catch {
      text = "upload failed";
    }
    throw new Error(`Upload failed (status ${res.status}): ${text}`);
  }

  const json = await res.json();
  if (!json || !json.url) throw new Error("Upload succeeded but no URL returned");
  return toPlayableUploadUrl(String(json.url));
}
