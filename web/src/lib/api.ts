export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

async function parse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? "Algo deu errado. Tente novamente", data.code);
  return data;
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: opts.method ?? "GET",
      credentials: "same-origin",
      headers: { "X-Requested-With": "sipat", ...(opts.body ? { "Content-Type": "application/json" } : {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Sem conexão com o servidor. Verifique sua internet e tente de novo", "offline");
  }
  return parse(res);
}

/** Envia UMA foto com progresso real (fetch ainda não expõe progresso de upload). */
export function uploadPhoto(token: string, file: Blob, name: string, albumId: string | undefined, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/public/events/${token}/upload`);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onerror = () => reject(new ApiError(0, "Sem conexão. Verifique sua internet e tente de novo", "offline"));
    xhr.ontimeout = () => reject(new ApiError(0, "O envio demorou demais. Tente de novo", "timeout"));
    xhr.timeout = 120_000;
    xhr.onload = () => {
      const body = xhr.response ?? {};
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      const msg = body.results?.[0]?.error ?? body.error ?? "Não foi possível enviar esta foto";
      reject(new ApiError(xhr.status, msg, body.code));
    };
    const form = new FormData();
    if (albumId) form.append("albumId", albumId);
    form.append("photos", file, name);
    xhr.send(form);
  });
}

/** Reduz fotos grandes no aparelho (economiza dados e evita falhas por limite de tamanho). */
export async function shrinkImage(file: Blob, maxSide = 2560, quality = 0.86): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 2 * 1024 * 1024) { bmp.close(); return file; }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // formato que o navegador não decodifica: o servidor valida de qualquer forma
  }
}
