import { createGlobalTheme, createGlobalThemeContract } from '@vanilla-extract/css'
import type { ChipType, Element } from '../data/games'

// Each leaf is the CSS name the var is written under: the sliders and test/rootVars.ts write
// --a and --c by name.
export const vars = createGlobalThemeContract({
  bg: 'bg',
  card: 'card',
  text: 'text',
  dim: 'dim',
  line: 'line',
  chip: {
    basic: 'basic',
    skill: 'skill',
    echo: 'echo',
    lib: 'lib',
    heavy: 'heavy',
    io: 'io',
    move: 'move',
    normal: 'normal',
    charged: 'charged',
    plunge: 'plunge',
    burst: 'burst',
    swap: 'swap'
  } satisfies Record<ChipType, string>,
  element: {
    anemo: 'anemo',
    geo: 'geo',
    electro: 'electro',
    dendro: 'dendro',
    hydro: 'hydro',
    pyro: 'pyro',
    cryo: 'cryo'
  } satisfies Record<Element, string>,
  a: 'a',
  c: 'c',
  gap: 'gap',
  chipInk: 'chip-ink',
  badgeBg: 'badge-bg',
  badgeInk: 'badge-ink',
  shadow: 'shadow',
  appBg: 'app-bg',
  appPanel: 'app-panel',
  appTextShadow: 'app-text-shadow',
  appBgCollapsed: 'app-bg-collapsed'
})

createGlobalTheme(':root', vars, {
  bg: '#101216',
  card: '#1a1d23',
  text: '#e8e8ea',
  dim: '#8a8f99',
  line: '#2a2e36',
  chip: {
    basic: '#4a505c',
    skill: '#2f6fd6',
    echo: '#8a4fd6',
    lib: '#c99a1e',
    heavy: '#d6662f',
    io: '#2e9e6a',
    move: '#3a7d8c',
    // Genshin chips; its skill and move reuse the two above
    normal: '#4a505c',
    charged: '#d6662f',
    plunge: '#a0527a',
    burst: '#c99a1e',
    swap: '#2e9e6a'
  },
  // Genshin elements, for the card tint
  element: {
    anemo: '#74c2a8',
    geo: '#f0b232',
    electro: '#af8ec1',
    dendro: '#a5c83b',
    hydro: '#4cc2f1',
    pyro: '#ef7938',
    cryo: '#9fd6e3'
  },
  a: '.4',
  c: '.6',
  gap: '6px',
  // roles beyond the palette; the app-* ones take --a and --c, which the sliders set on :root
  chipInk: '#111',
  badgeBg: '#0008',
  badgeInk: '#fff',
  shadow: '#000',
  appBg: `rgb(from ${vars.bg} r g b / ${vars.a})`,
  appPanel: `rgb(from ${vars.card} r g b / ${vars.c})`,
  appTextShadow: `0 1px 2px ${vars.shadow}`,
  appBgCollapsed: `rgb(from ${vars.bg} r g b / max(${vars.a}, .7))`
})
