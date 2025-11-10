export function streamToConsole(chunk: string): void {
  process.stdout.write(chunk);
}
