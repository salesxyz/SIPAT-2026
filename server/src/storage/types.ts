export interface StorageDriver {
  /** Garante que o bucket/pasta exista. */
  init(): Promise<void>;
  put(path: string, data: Buffer, contentType: string): Promise<void>;
  read(path: string): Promise<Buffer>;
  remove(paths: string[]): Promise<void>;
  /** URLs temporárias (não previsíveis) para exibir ou baixar. */
  signedUrls(paths: string[], expiresIn: number, downloadName?: string): Promise<string[]>;
}
