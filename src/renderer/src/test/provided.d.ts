// What vitest.global-setup.ts provides to inject(). Both tsconfigs include this file, so
// the key is typed on the providing side and the injecting side alike.
declare module 'vitest' {
  interface ProvidedContext {
    // ids (path under rotations/, no .json) of every file on disk, sorted
    shippedRotationIds: string[]
  }
}

export {}
