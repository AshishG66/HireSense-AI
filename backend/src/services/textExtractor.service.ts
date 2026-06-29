import pdfParse from 'pdf-parse';
import logger from '../lib/logger';

export class TextExtractorService {
  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType === 'application/pdf') {
      try {
        const data = await (pdfParse as any)(buffer);
        return data.text || '';
      } catch (err: any) {
        logger.error(`pdf-parse failed: ${err.message}. Falling back to plain text strings.`);
        return buffer.toString('utf8');
      }
    }
    return buffer.toString('utf8');
  }
}

export const textExtractorService = new TextExtractorService();
export default textExtractorService;
