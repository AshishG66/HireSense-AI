export interface SpeechToTextProvider {
  transcribe(audioBuffer: Buffer, mimeType: string): Promise<string>;
}

export interface TextToSpeechProvider {
  synthesize(text: string): Promise<Buffer>;
}
