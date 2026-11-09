import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { RawFile } from '../../../preload/api'
import { loadRotations, type Loaded } from '../data/loadRotations'
import { useNavigation, type Shown } from './useNavigation'

// `skill` is a chip in both games, so one builder serves genshin/ and wuwa/
const variant = (id: string) => ({
  id,
  label: id,
  units: [{ icon: '🌀', name: 'Unit', steps: [[{ type: 'skill', label: 'Skill' }]] }]
})
const file = (id: string, order: number, variantIds: string[] = ['std']): RawFile => ({
  file: `${id}.json`,
  text: JSON.stringify({ label: id, order, variants: variantIds.map(variant) })
})
const broken = (id: string): RawFile => ({ file: `${id}.json`, text: '{' })
const unknownFolder: RawFile = { file: 'hsr/x.json', text: '{}' }

// tests remember each game's second team, so a fall back to the first team shows up
const skirk = file('genshin/skirk', 1)
const mizuki = file('genshin/mizuki', 2, ['std', 'alt'])
const mornye = file('wuwa/mornye', 1)
const chisa = file('wuwa/chisa', 2, ['std', 'alt'])
const ALL = [skirk, mizuki, mornye, chisa]
const EMPTY: Loaded = { ok: [], errors: [] }

const load = (...files: RawFile[]) => loadRotations(files)
const store = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value))
const stored = (key: string): unknown => {
  const raw = localStorage.getItem(key)
  return raw === null ? null : JSON.parse(raw)
}
const mount = (loaded: Loaded) =>
  renderHook(({ loaded }) => useNavigation(loaded), { initialProps: { loaded } })

const where = (s: Shown): string => {
  switch (s.screen) {
    case 'games':
      return 'games'
    case 'teams':
      return s.canBack ? `teams ${s.group.id}` : `teams ${s.group.id} (no back)`
    case 'rotation':
      return `rotation ${s.team.id} ${s.variant.id}`
    case 'broken':
      return `broken ${s.teamId}`
  }
}

beforeEach(() => localStorage.clear())

describe('useNavigation at launch', () => {
  it('opens on the stored lastTeam with its stored variant', () => {
    store('lastTeam', 'wuwa/chisa')
    store('variantByTeam', { 'wuwa/chisa': 'alt' })
    const { result } = mount(load(...ALL))
    expect(where(result.current.shown)).toBe('rotation wuwa/chisa alt')
  })

  it('opens on games when nothing is stored', () => {
    const { result } = mount(load(...ALL))
    const { shown } = result.current
    expect(where(shown)).toBe('games')
    expect(shown.screen === 'games' && shown.games.map((g) => g.id)).toEqual(['genshin', 'wuwa'])
  })

  it('keeps the stored team through an empty first load', () => {
    store('lastTeam', 'genshin/mizuki')
    const { result, rerender } = mount(EMPTY)
    expect(where(result.current.shown)).toBe('games')
    expect(stored('lastTeam')).toBe('genshin/mizuki')

    rerender({ loaded: load(...ALL) })
    expect(where(result.current.shown)).toBe('rotation genshin/mizuki std')
  })

  it("follows the stored team's file: broken, then gone, then back", () => {
    store('lastTeam', 'genshin/mizuki')
    const bad = load(skirk, broken('genshin/mizuki'), mornye, chisa)
    const { result, rerender } = mount(bad)
    expect(result.current.shown).toEqual({
      screen: 'broken',
      teamId: 'genshin/mizuki',
      problem: bad.errors[0]
    })

    rerender({ loaded: load(skirk, mornye, chisa) })
    expect(where(result.current.shown)).toBe('teams genshin')

    rerender({ loaded: load(...ALL) })
    expect(where(result.current.shown)).toBe('rotation genshin/mizuki std')
  })

  it('opens the first variant when the stored one is gone', () => {
    store('lastTeam', 'wuwa/chisa')
    store('variantByTeam', { 'wuwa/chisa': 'gone' })
    const { result } = mount(load(...ALL))
    expect(where(result.current.shown)).toBe('rotation wuwa/chisa std')
  })
})

describe('useNavigation skips the games step only with one game and no Other', () => {
  it('one game and no Other: its teams, with no back', () => {
    const { result } = mount(load(mornye, chisa))
    expect(where(result.current.shown)).toBe('teams wuwa (no back)')
  })

  it('two games: the games', () => {
    const { result } = mount(load(...ALL))
    expect(where(result.current.shown)).toBe('games')
  })

  it('one game plus an Other problem: the games', () => {
    const { result } = mount(load(mornye, chisa, unknownFolder))
    const { shown } = result.current
    expect(where(shown)).toBe('games')
    expect(shown.screen === 'games' && shown.other.map((p) => p.file)).toEqual(['hsr/x.json'])
  })

  // a back there would only lead to the same teams without one
  it('one game: back from a rotation lands on teams with no back either', () => {
    store('lastTeam', 'wuwa/chisa')
    const { result } = mount(load(mornye, chisa))
    act(() => result.current.back())
    expect(where(result.current.shown)).toBe('teams wuwa (no back)')
  })

  it('only an unknown-folder file: games with none, and its problem', () => {
    const loaded = load(unknownFolder)
    const { result } = mount(loaded)
    expect(result.current.shown).toEqual({ screen: 'games', games: [], other: loaded.errors })
  })
})

describe('useNavigation picking', () => {
  it('pickGame opens the remembered team', () => {
    store('teamByGame', { genshin: 'genshin/mizuki' })
    const { result } = mount(load(...ALL))
    act(() => result.current.pickGame('genshin'))
    expect(where(result.current.shown)).toBe('rotation genshin/mizuki std')
  })

  it('pickGame opens the remembered team when its file is broken', () => {
    store('teamByGame', { genshin: 'genshin/mizuki' })
    const { result } = mount(load(skirk, broken('genshin/mizuki'), mornye, chisa))
    act(() => result.current.pickGame('genshin'))
    expect(where(result.current.shown)).toBe('broken genshin/mizuki')
  })

  it("pickGame with no remembered team opens the game's teams", () => {
    const { result } = mount(load(...ALL))
    act(() => result.current.pickGame('genshin'))
    expect(where(result.current.shown)).toBe('teams genshin')
  })

  // a relaunch opens the last rotation shown, and a gone team was never shown
  it("pickGame with a gone remembered team opens the game's teams, lastTeam unwritten", () => {
    store('teamByGame', { genshin: 'genshin/gone' })
    const { result } = mount(load(...ALL))
    act(() => result.current.pickGame('genshin'))
    expect(where(result.current.shown)).toBe('teams genshin')
    expect(stored('lastTeam')).toBeNull()
  })

  it('Genshin, then WuWa, then Genshin lands on the same team and variant', () => {
    const { result } = mount(load(...ALL))
    act(() => result.current.pickGame('genshin'))
    act(() => result.current.pickTeam('genshin/mizuki'))
    act(() => result.current.pickVariant('alt'))
    expect(where(result.current.shown)).toBe('rotation genshin/mizuki alt')

    act(() => result.current.back())
    act(() => result.current.back())
    act(() => result.current.pickGame('wuwa'))
    act(() => result.current.pickTeam('wuwa/chisa'))
    expect(where(result.current.shown)).toBe('rotation wuwa/chisa std')

    act(() => result.current.back())
    act(() => result.current.back())
    act(() => result.current.pickGame('genshin'))
    expect(where(result.current.shown)).toBe('rotation genshin/mizuki alt')
  })

  it('a remount opens the last team picked, on its variant', () => {
    const first = mount(load(...ALL))
    act(() => first.result.current.pickTeam('wuwa/chisa'))
    act(() => first.result.current.pickVariant('alt'))
    first.unmount()

    const { result } = mount(load(...ALL))
    expect(where(result.current.shown)).toBe('rotation wuwa/chisa alt')
  })
})

describe('useNavigation back', () => {
  it("from a rotation lands on its game's teams, and from there on games", () => {
    store('lastTeam', 'genshin/mizuki')
    const { result } = mount(load(...ALL))
    act(() => result.current.back())
    expect(where(result.current.shown)).toBe('teams genshin')
    act(() => result.current.back())
    expect(where(result.current.shown)).toBe('games')
  })

  it("from a broken team lands on its game's teams", () => {
    store('lastTeam', 'genshin/mizuki')
    const { result } = mount(load(skirk, broken('genshin/mizuki'), mornye, chisa))
    act(() => result.current.back())
    expect(where(result.current.shown)).toBe('teams genshin')
  })

  // the stored view is still the rotation; back goes on from the teams that fell back in its place
  it('from the teams a gone stored team fell back to goes on to games', () => {
    store('lastTeam', 'genshin/mizuki')
    const { result } = mount(load(skirk, mornye, chisa))
    expect(where(result.current.shown)).toBe('teams genshin')
    act(() => result.current.back())
    expect(where(result.current.shown)).toBe('games')
  })

  // a game that joins later makes back real, but only a teams screen that had one runs it
  it('a back with nowhere to go does not send the teams to games once a second game loads', () => {
    const { result, rerender } = mount(load(mornye, chisa))
    act(() => result.current.pickGame('wuwa'))
    expect(where(result.current.shown)).toBe('teams wuwa (no back)')
    act(() => result.current.back())
    expect(where(result.current.shown)).toBe('teams wuwa (no back)')

    rerender({ loaded: load(...ALL) })
    expect(where(result.current.shown)).toBe('teams wuwa')
  })
})

describe('useNavigation errorCount', () => {
  it('counts only errors not shown in place', () => {
    store('lastTeam', 'genshin/mizuki')
    const { result } = mount(load(skirk, broken('genshin/mizuki'), broken('wuwa/bad'), mornye))
    expect(where(result.current.shown)).toBe('broken genshin/mizuki')
    expect(result.current.errorCount).toBe(1)
  })

  it('counts every error when none is the one shown', () => {
    store('lastTeam', 'genshin/mizuki')
    const { result } = mount(load(skirk, mizuki, broken('wuwa/bad'), mornye))
    expect(where(result.current.shown)).toBe('rotation genshin/mizuki std')
    expect(result.current.errorCount).toBe(1)
  })
})
