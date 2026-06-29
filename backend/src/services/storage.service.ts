import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { StorageProvider, UploadResult } from '../interfaces/storage.interface';
import env from '../config/env';
import logger from '../lib/logger';

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'resumes');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }): Promise<UploadResult> {
    const fileExt = path.extname(file.originalname);
    const uniqueName = `${crypto.randomUUID()}${fileExt}`;
    const storagePath = path.join(this.uploadDir, uniqueName);

    await fs.promises.writeFile(storagePath, file.buffer);

    const baseUrl = env.PORT ? `http://localhost:${env.PORT}` : 'http://localhost:5000';
    const fileUrl = `${baseUrl}/api/v1/resumes/versions/download-raw?path=${encodeURIComponent(uniqueName)}`;

    return {
      fileUrl,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storagePath: uniqueName,
    };
  }

  async download(storagePath: string): Promise<Buffer> {
    const fullPath = path.join(this.uploadDir, storagePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found in local storage');
    }
    return fs.promises.readFile(fullPath);
  }

  async delete(storagePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, storagePath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  async getSignedUrl(storagePath: string): Promise<string> {
    const baseUrl = env.PORT ? `http://localhost:${env.PORT}` : 'http://localhost:5000';
    return `${baseUrl}/api/v1/resumes/versions/download-raw?path=${encodeURIComponent(storagePath)}`;
  }
}

export class S3StorageProvider implements StorageProvider {
  async upload(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }): Promise<UploadResult> {
    logger.info(`AWS S3 Upload Triggered for ${file.originalname} (Simulation)`);
    const storagePath = `s3-prefix/${crypto.randomUUID()}-${file.originalname}`;
    return {
      fileUrl: `https://hiresense-bucket.s3.amazonaws.com/${storagePath}`,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storagePath,
    };
  }

  async download(storagePath: string): Promise<Buffer> {
    logger.info(`AWS S3 Download Triggered for ${storagePath} (Simulation)`);
    return Buffer.from('Simulated S3 File Content');
  }

  async delete(storagePath: string): Promise<void> {
    logger.info(`AWS S3 Delete Triggered for ${storagePath} (Simulation)`);
  }

  async getSignedUrl(storagePath: string): Promise<string> {
    return `https://hiresense-bucket.s3.amazonaws.com/${storagePath}?signed=true`;
  }
}

export class CloudinaryStorageProvider implements StorageProvider {
  async upload(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }): Promise<UploadResult> {
    logger.info(`Cloudinary Upload Triggered for ${file.originalname} (Simulation)`);
    const storagePath = `cloudinary-prefix/${crypto.randomUUID()}`;
    return {
      fileUrl: `https://res.cloudinary.com/hiresense/image/upload/${storagePath}`,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storagePath,
    };
  }

  async download(storagePath: string): Promise<Buffer> {
    logger.info(`Cloudinary Download Triggered for ${storagePath} (Simulation)`);
    return Buffer.from('Simulated Cloudinary File Content');
  }

  async delete(storagePath: string): Promise<void> {
    logger.info(`Cloudinary Delete Triggered for ${storagePath} (Simulation)`);
  }

  async getSignedUrl(storagePath: string): Promise<string> {
    return `https://res.cloudinary.com/hiresense/image/upload/${storagePath}`;
  }
}

export class StorageService implements StorageProvider {
  private activeProvider: StorageProvider;

  constructor() {
    const provider = env.STORAGE_PROVIDER;
    logger.info(`Initializing StorageService with provider: ${provider}`);

    switch (provider) {
      case 's3':
        this.activeProvider = new S3StorageProvider();
        break;
      case 'cloudinary':
        this.activeProvider = new CloudinaryStorageProvider();
        break;
      case 'local':
      default:
        this.activeProvider = new LocalStorageProvider();
        break;
    }
  }

  async upload(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }): Promise<UploadResult> {
    return this.activeProvider.upload(file);
  }

  async download(storagePath: string): Promise<Buffer> {
    return this.activeProvider.download(storagePath);
  }

  async delete(storagePath: string): Promise<void> {
    return this.activeProvider.delete(storagePath);
  }

  async getSignedUrl(storagePath: string): Promise<string> {
    return this.activeProvider.getSignedUrl(storagePath);
  }
}

export const storageService = new StorageService();
export default storageService;
