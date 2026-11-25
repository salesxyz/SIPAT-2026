export interface Settings { [key: string]: string }
export interface Album { id: string; name: string; description: string | null; photoCount: number }
export interface PublicEvent {
  name: string; description: string | null; location: string | null; date: string | null;
  accepting: boolean; photoCount: number; albums: Album[];
}
export interface PublicEventListItem {
  token: string; name: string; location: string | null; date: string | null; accepting: boolean; photoCount: number; coverUrl: string | null;
}
export interface Photo {
  id: string; albumId: string; eventId: string; fileName: string; fileSize: number; mimeType: string; uploadedAt: string; thumbUrl: string; url: string;
}
export interface PhotoPage { total: number; page: number; limit: number; photos: Photo[] }
export interface AdminEvent {
  id: string; name: string; description: string | null; location: string | null; date: string | null;
  status: "active" | "closed"; isListed: boolean; createdAt: string; qrCodeToken: string; uploadUrl: string;
  photoCount: number; albumCount: number;
}
export interface AdminAlbum { id: string; eventId: string; name: string; description: string | null; photoCount: number; createdAt: string }
export interface Me { id: string; name: string; email: string }
