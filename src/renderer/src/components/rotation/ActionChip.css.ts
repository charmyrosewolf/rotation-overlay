import { style, type StyleRule } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import type { ChipType } from '../../data/games'
import { vars } from '../../styles/theme.css'

// satisfies: a chip type added to a game fails typecheck here until it gets a colour.
// lib and burst are the eye-catchers, so they take dark ink.
const type = {
  basic: { background: vars.chip.basic },
  skill: { background: vars.chip.skill },
  echo: { background: vars.chip.echo },
  lib: { background: vars.chip.lib, color: vars.chipInk },
  heavy: { background: vars.chip.heavy },
  io: { background: vars.chip.io },
  move: { background: vars.chip.move },
  normal: { background: vars.chip.normal },
  charged: { background: vars.chip.charged },
  plunge: { background: vars.chip.plunge },
  burst: { background: vars.chip.burst, color: vars.chipInk },
  swap: { background: vars.chip.swap }
} satisfies Record<ChipType, StyleRule>

export const chip = recipe({
  base: {
    padding: '1px 6px',
    borderRadius: 4,
    fontWeight: 600,
    fontSize: 13,
    whiteSpace: 'nowrap'
  },
  variants: {
    type,
    small: { true: { fontWeight: 500, fontSize: 11 } }
  }
})

export const key = style({
  marginLeft: 5,
  padding: '0 4px',
  borderRadius: 3,
  background: vars.badgeBg,
  color: vars.badgeInk,
  font: '600 11px/1.4 ui-monospace, Consolas, monospace'
})
