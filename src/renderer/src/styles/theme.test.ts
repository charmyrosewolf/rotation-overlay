import { expect, it } from 'vitest'
import { vars } from './theme.css'

// the sliders and test/rootVars.ts write these by name
it('keeps the CSS names the sliders write', () => {
  expect(vars.a).toBe('var(--a)')
  expect(vars.c).toBe('var(--c)')
})

it('keeps every token at its original CSS variable name', () => {
  expect(vars.bg).toBe('var(--bg)')
  expect(vars.chip.burst).toBe('var(--burst)')
  expect(vars.element.cryo).toBe('var(--cryo)')
  expect(vars.chipInk).toBe('var(--chip-ink)')
  expect(vars.appPanel).toBe('var(--app-panel)')
  expect(vars.appBgCollapsed).toBe('var(--app-bg-collapsed)')
})
