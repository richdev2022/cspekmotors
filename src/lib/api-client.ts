"use client";

// ------------------------------------------------------------
// Typed fetch helpers for admin panel (client-side)
// ------------------------------------------------------------
export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        ...(init?.body && typeof init.body === "string" ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      credentials: "same-origin",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      return { ok: false, status: res.status, error: json.error || `Request failed (${res.status})` };
    }
    return { ok: true, status: res.status, data: json.data };
  } catch {
    return { ok: false, status: 0, error: "Network error — please check your connection." };
  }
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  del: <T>(url: string) => request<T>(url, { method: "DELETE" }),
  upload: <T>(url: string, formData: FormData, onProgress?: (pct: number) => void) =>
    new Promise<ApiResult<T>>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && json.success) {
            resolve({ ok: true, status: xhr.status, data: json.data });
          } else {
            resolve({ ok: false, status: xhr.status, error: json.error || `Upload failed (${xhr.status})` });
          }
        } catch {
          resolve({ ok: false, status: xhr.status, error: "Upload failed — invalid server response." });
        }
      };
      xhr.onerror = () => resolve({ ok: false, status: 0, error: "Network error during upload." });
      xhr.send(formData);
    }),
};
