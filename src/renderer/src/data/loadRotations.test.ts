// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { RawFile } from '../../../preload/api'
import { loadRotations, type Loaded } from './loadRotations'
import { rotationFileSchema } from './schema'

const chip = (type: string, label: string, key?: string) =>
  key ? { type, label, key } : { type, label }
const unit = (over: object = {}) => ({
  icon: '🌀',
  name: 'Chisa — opener',
  summary: 'cut, ult',
  steps: [[chip('basic', 'Basic', 'LMB'), { note: 'cancel' }], [chip('skill', 'Skill', 'E')]],
  ...over
})
const variant = (id = 'std', over: object = {}) => ({
  id,
  label: 'Standard',
  units: [unit()],
  ...over
})
const rotation = (over: object = {}) => ({ label: 'Left', variants: [variant()], ...over })
const withUnit = (over: object) => rotation({ variants: [variant('std', { units: [unit(over)] })] })
const withSteps = (steps: unknown[]) => withUnit({ steps })
const FIRST_ITEM = 'variants.0.units.0.steps.0.0'
const raw = (file: string, body: unknown): RawFile => ({ file, text: JSON.stringify(body) })
const ids = (r: Loaded) => r.ok.map((t) => t.id)

describe('loadRotations', () => {
  it('returns valid files as teams, ordered by order then filename', () => {
    const r = loadRotations([
      raw('wuwa/b-team.json', rotation({ label: 'B', order: 2 })),
      raw('wuwa/a-team.json', rotation({ label: 'A', order: 1 }))
    ])
    expect(ids(r)).toEqual(['wuwa/a-team', 'wuwa/b-team'])
    expect(r.errors).toEqual([])
    expect(r.ok[0]).toEqual({
      id: 'wuwa/a-team',
      game: 'wuwa',
      label: 'A',
      order: 1,
      variants: [variant()]
    })
  })

  it('sorts by game before order', () => {
    const r = loadRotations([
      raw('wuwa/x.json', rotation({ order: 1 })),
      raw('hsr/y.json', rotation({ order: 9 }))
    ])
    expect(ids(r)).toEqual(['hsr/y', 'wuwa/x'])
  })

  it('puts files without order after numbered ones, ties on filename, order 0 first', () => {
    const r = loadRotations([
      raw('wuwa/m.json', rotation()),
      raw('wuwa/z.json', rotation({ order: 1 })),
      raw('wuwa/b.json', rotation()),
      raw('wuwa/c.json', rotation({ order: 1 })),
      raw('wuwa/y.json', rotation({ order: 0 }))
    ])
    expect(ids(r)).toEqual(['wuwa/y', 'wuwa/c', 'wuwa/z', 'wuwa/b', 'wuwa/m'])
  })

  it('keeps the good file when another has a chip type outside the list', () => {
    const bad = withSteps([[chip('ult', 'Ult')]])
    const r = loadRotations([raw('wuwa/bad.json', bad), raw('wuwa/good.json', rotation())])
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0]!.file).toBe('wuwa/bad.json')
    expect(r.errors[0]!.message).toMatch(/^variants\.0\.units\.0\.steps\.0\.0\.type: /)
    expect(ids(r)).toEqual(['wuwa/good'])
  })

  it('joins deeper zod paths with dots', () => {
    const units = [unit(), unit(), unit({ steps: [[chip('basic', 'Basic')], [chip('nope', 'X')]] })]
    const bad = rotation({ variants: [variant('a'), variant('b', { units })] })
    const r = loadRotations([raw('wuwa/bad.json', bad)])
    expect(r.errors[0]?.message).toMatch(/^variants\.1\.units\.2\.steps\.1\.0\.type: /)
  })

  it.each([
    ['empty', ''],
    ['truncated', '{"label": "Left", "vari']
  ])('reports %s text as a JSON error for that file only', (_name, text) => {
    const r = loadRotations([{ file: 'wuwa/saving.json', text }, raw('wuwa/good.json', rotation())])
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0]!.file).toBe('wuwa/saving.json')
    expect(r.errors[0]!.message).toMatch(/^JSON: .+/)
    expect(ids(r)).toEqual(['wuwa/good'])
  })

  it('rejects a file that is not an object', () => {
    const r = loadRotations([raw('wuwa/list.json', [])])
    expect(r.ok).toEqual([])
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0]!.file).toBe('wuwa/list.json')
  })

  it('rejects a file with no variants, at path variants', () => {
    const r = loadRotations([raw('wuwa/none.json', rotation({ variants: [] }))])
    expect(r.ok).toEqual([])
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0]!.message).toMatch(/^variants: /)
  })

  it('rejects duplicate variant ids in one file, at path variants', () => {
    const dup = rotation({ variants: [variant('same'), variant('same')] })
    const r = loadRotations([raw('wuwa/dup.json', dup), raw('wuwa/good.json', rotation())])
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0]!.file).toBe('wuwa/dup.json')
    expect(r.errors[0]!.message).toMatch(/^variants: /)
    expect(ids(r)).toEqual(['wuwa/good'])
  })

  // Two variants alone, or a shared label alone, must not trip the uniqueness check.
  it('accepts two variants with different ids that share a label', () => {
    const two = rotation({
      variants: [variant('a', { label: 'Same' }), variant('b', { label: 'Same' })]
    })
    const r = loadRotations([raw('wuwa/two.json', two)])
    expect(r.errors).toEqual([])
    expect(r.ok[0]?.variants.map((v) => v.id)).toEqual(['a', 'b'])
  })

  it('rejects a file with no game folder, as a problem rather than a team', () => {
    const r = loadRotations([raw('loose.json', rotation()), raw('wuwa/good.json', rotation())])
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0]!.file).toBe('loose.json')
    expect(r.errors[0]!.message).toMatch(/game folder/)
    expect(ids(r)).toEqual(['wuwa/good'])
  })

  it('reports one problem per file, for the first issue, when a file has several', () => {
    // wrong-typed label, then a chip type outside the list
    const bad = { ...withSteps([[chip('ult', 'U')]]), label: 5 }
    // precondition: the fixture really has more than one issue
    expect(rotationFileSchema.safeParse(bad).error?.issues.length).toBeGreaterThan(1)
    const r = loadRotations([raw('wuwa/many.json', bad), raw('wuwa/good.json', rotation())])
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0]!.file).toBe('wuwa/many.json')
    expect(r.errors[0]!.message).toMatch(/^label: /)
    expect(r.errors[0]!.message).not.toContain('variants') // the second issue's path
    expect(ids(r)).toEqual(['wuwa/good'])
  })

  it.each([
    ['file', rotation({ colour: 'red' }), ''],
    ['variant', rotation({ variants: [variant('std', { colour: 'red' })] }), 'variants.0: '],
    ['unit', withUnit({ colour: 'red' }), 'variants.0.units.0: '],
    ['chip', withSteps([[{ ...chip('basic', 'B'), colour: 'red' }]]), FIRST_ITEM],
    ['note', withSteps([[{ note: 'x', colour: 'red' }]]), FIRST_ITEM]
  ])('rejects an unknown key on a %s and names it', (_where, body, prefix) => {
    const r = loadRotations([raw('wuwa/extra.json', body), raw('wuwa/good.json', rotation())])
    expect(r.errors).toHaveLength(1)
    expect(r.errors[0]!.file).toBe('wuwa/extra.json')
    expect(r.errors[0]!.message.startsWith(prefix)).toBe(true)
    expect(r.errors[0]!.message).toContain('colour')
    expect(ids(r)).toEqual(['wuwa/good'])
  })
})
