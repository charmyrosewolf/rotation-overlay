// Types only: both tsconfigs include this file, so no runtime imports here.

// file: path under rotations/ with forward slashes on every OS, e.g. 'wuwa/x.json'
export type RawFile = { file: string; text: string }

export type OverlayApi = {
  collapse(height: number): void
  expand(): void
  rotations: { list(): Promise<RawFile[]>; onChange(cb: (files: RawFile[]) => void): () => void }
}
