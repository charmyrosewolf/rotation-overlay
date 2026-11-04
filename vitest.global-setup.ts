import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import type { TestProject } from 'vitest/node'

// Lists the shipped rotations/ folder for tests that run in the web program, which has
// no node types. They read it back with inject('shippedRotationIds').
export default function setup(project: TestProject): void {
  const ids = readdirSync(resolve(import.meta.dirname, 'rotations'), {
    recursive: true,
    encoding: 'utf8'
  })
    .map((path) => path.replaceAll('\\', '/'))
    .filter((path) => path.endsWith('.json'))
    .map((path) => path.replace(/\.json$/, ''))
    .toSorted()
  project.provide('shippedRotationIds', ids)
}
