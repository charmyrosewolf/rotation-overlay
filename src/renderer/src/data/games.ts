// One entry per game folder. No import from schema.ts: schema imports this.

export const ELEMENTS = ['anemo', 'geo', 'electro', 'dendro', 'hydro', 'pyro', 'cryo'] as const
export type Element = (typeof ELEMENTS)[number]

// `key` is the type's default; the legend shows it, a step chip only a key that differs.
export type ChipDef = { label: string; title: string; key?: string }
export type GameDef = { name: string; chips: Record<string, ChipDef>; elements: boolean }

// Insertion order of `chips` is the legend order.
// `satisfies` (not an annotation) keeps the chip keys literal, for ChipType.
const games = {
  genshin: {
    name: 'Genshin Impact',
    elements: true,
    chips: {
      normal: { label: 'Normal', title: 'Normal Attack', key: 'LMB' },
      charged: { label: 'Charged', title: 'Charged Attack', key: 'hold LMB' },
      plunge: { label: 'Plunge', title: 'Plunging Attack', key: 'LMB (airborne)' },
      skill: { label: 'Skill', title: 'Elemental Skill', key: 'E' },
      burst: { label: 'Burst', title: 'Elemental Burst', key: 'Q' },
      swap: { label: 'Swap', title: 'Swap character' },
      move: { label: 'Move', title: 'Dash / Jump / Drift' }
    }
  },
  wuwa: {
    name: 'Wuthering Waves',
    elements: false,
    chips: {
      basic: { label: 'Basic', title: 'Basic Attack', key: 'LMB' },
      skill: { label: 'Skill', title: 'Resonance Skill', key: 'E' },
      echo: { label: 'Echo', title: 'Echo Skill', key: 'Q' },
      lib: { label: 'Lib', title: 'Resonance Liberation', key: 'R' },
      heavy: { label: 'Heavy', title: 'Heavy Attack', key: 'hold LMB' },
      forte: { label: 'Forte', title: 'Forte Skill', key: 'E' },
      io: { label: 'Intro/Outro', title: 'Intro / Outro Skill', key: 'auto' },
      move: { label: 'Move', title: 'Dodge / Jump', key: 'Shift · Space' }
    }
  }
} satisfies Record<string, GameDef>

// Every game's chip keys, so a colour map can be checked for completeness.
export type ChipType = {
  [G in keyof typeof games]: keyof (typeof games)[G]['chips']
}[keyof typeof games]

export const GAMES: Record<string, GameDef> = games
