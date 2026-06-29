import logger from '../lib/logger';
import { SpeechToTextProvider, TextToSpeechProvider } from '../interfaces/speech.interface';

export class MockSpeechToTextProvider implements SpeechToTextProvider {
  async transcribe(audioBuffer: Buffer, mimeType: string): Promise<string> {
    logger.info(`STT: Transcribing audio buffer of size ${audioBuffer.length} bytes (Simulation)`);
    return 'In my experience, asynchronous operations are best managed using Redux Toolkit queries or custom async thunks. This isolates state checks and handles loading and error states cleanly.';
  }
}

export class MockTextToSpeechProvider implements TextToSpeechProvider {
  async synthesize(text: string): Promise<Buffer> {
    logger.info(`TTS: Synthesizing speech for: "${text.substring(0, 30)}..." (Simulation)`);
    return Buffer.from('Simulated WAV audio bytes');
  }
}

export class SpeechService {
  private sttProvider: SpeechToTextProvider;
  private ttsProvider: TextToSpeechProvider;

  constructor() {
    this.sttProvider = new MockSpeechToTextProvider();
    this.ttsProvider = new MockTextToSpeechProvider();
  }

  async transcribe(audioBuffer: Buffer, mimeType: string): Promise<string> {
    return this.sttProvider.transcribe(audioBuffer, mimeType);
  }

  async synthesize(text: string): Promise<Buffer> {
    return this.ttsProvider.synthesize(text);
  }
}

export const speechService = new SpeechService();
export default speechService;
