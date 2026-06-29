export interface UploadResult {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  storagePath: string;
}

export interface StorageProvider {
  upload(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }): Promise<UploadResult>;
  download(storagePath: string): Promise<Buffer>;
  delete(storagePath: string): Promise<void>;
  getSignedUrl(storagePath: string): Promise<string>;
}
