// @vitest-environment node
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { listRotations } from '../../../main/rotations'
import { loadRotations } from './loadRotations'

// Reads the real rotations/ folder through the same list + parse path the app uses.
// Checks validity only: those files are edited live, so their content is not pinned here.
const dir = resolve(import.meta.dirname, '../../../../rotations')
const loaded = loadRotations(await listRotations(dir))

describe('shipped rotations', () => {
  it('every file passes the schema', () => {
    expect(loaded.errors).toEqual([])
  })

  it('at least one team loads, so the check above is not vacuous', () => {
    expect(loaded.ok.length).toBeGreaterThan(0)
  })
})
