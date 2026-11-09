// @vitest-environment node
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { listRotations } from '../../../main/rotations'
import { groupByGame, loadRotations } from './loadRotations'

// Reads the real rotations/ folder through the same list + parse path the app uses.
// Those files are edited live, so content is not pinned beyond validity, the game folders
// and Genshin's elements.
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

describe('shipped rotations by game', () => {
  const { games } = groupByGame(loaded)
  const genshinUnits = games
    .filter((g) => g.id === 'genshin')
    .flatMap((g) => g.teams.flatMap((t) => t.variants.flatMap((v) => v.units)))

  it('lists genshin and wuwa, by folder', () => {
    expect(games.map((g) => g.id)).toEqual(['genshin', 'wuwa'])
  })

  // The Loop card is not a character, so it is the one unit without an element.
  it('every genshin unit except Loop has an element', () => {
    expect(genshinUnits.map((u) => u.name)).toContain('Loop')
    expect(genshinUnits.filter((u) => u.name !== 'Loop' && !u.element).map((u) => u.name)).toEqual(
      []
    )
    expect(genshinUnits.filter((u) => u.name !== 'Loop').length).toBeGreaterThan(0)
  })

  it('the Loop card has no element', () => {
    const loop = genshinUnits.find((u) => u.name === 'Loop')
    expect(loop).toBeDefined()
    expect(loop?.element).toBeUndefined()
  })
})
