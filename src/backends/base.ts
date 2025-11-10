export type StreamCallback = (chunk: string) => void;

export abstract class ModelBackend {
  abstract chat(prompt: string, onStream?: StreamCallback): Promise<string | void>;
}
