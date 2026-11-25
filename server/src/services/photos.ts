import { prisma } from "../lib/prisma.js";
import { storage } from "../storage/index.js";
import type { Photo } from "../generated/client.js";

const URL_TTL = 60 * 60; // 1 hora

export async function presentPhotos(photos: Photo[]) {
  if (!photos.length) return [];
  const thumbs = await storage.signedUrls(photos.map((p) => p.thumbPath ?? p.filePath), URL_TTL);
  const fulls = await storage.signedUrls(photos.map((p) => p.filePath), URL_TTL);
  return photos.map((p, i) => ({
    id: p.id,
    albumId: p.albumId,
    eventId: p.eventId,
    fileName: p.fileName,
    fileSize: p.fileSize,
    mimeType: p.mimeType,
    uploadedAt: p.uploadedAt,
    thumbUrl: thumbs[i],
    url: fulls[i],
  }));
}

/** Remove arquivos do storage e depois os registros (sem deixar órfãos). */
export async function deletePhotos(photos: Pick<Photo, "id" | "filePath" | "thumbPath">[]) {
  if (!photos.length) return 0;
  const paths = photos.flatMap((p) => [p.filePath, ...(p.thumbPath ? [p.thumbPath] : [])]);
  await storage.remove(paths);
  const { count } = await prisma.photo.deleteMany({ where: { id: { in: photos.map((p) => p.id) } } });
  return count;
}

export async function downloadUrl(photo: Pick<Photo, "filePath" | "fileName">) {
  const [url] = await storage.signedUrls([photo.filePath], 120, photo.fileName);
  return url;
}
