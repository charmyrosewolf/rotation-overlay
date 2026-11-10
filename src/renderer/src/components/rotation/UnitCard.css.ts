import { style, styleVariants } from '@vanilla-extract/css'
import type { Element } from '../../data/games'
import { vars } from '../../styles/theme.css'

export const card = style({
  padding: '6px 8px',
  marginBottom: vars.gap,
  borderRadius: '8px',
  background: vars.appPanel,
  textShadow: vars.appTextShadow,
  cursor: 'pointer'
})

export const marked = style({ outline: `2px solid ${vars.chip.lib}` })

const edgeColour = {
  anemo: vars.element.anemo,
  geo: vars.element.geo,
  electro: vars.element.electro,
  dendro: vars.element.dendro,
  hydro: vars.element.hydro,
  pyro: vars.element.pyro,
  cryo: vars.element.cryo
} satisfies Record<Element, string>

// a left edge, not a fill: geo and cryo are light and wash out the chips and text
export const edge = styleVariants(edgeColour, (colour) => ({
  boxShadow: `inset 3px 0 0 ${colour}`
}))

export const title = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: vars.gap,
  margin: '0 0 2px',
  fontSize: '15px'
})

export const summary = style({
  color: vars.dim,
  fontWeight: 400,
  fontStyle: 'italic',
  textAlign: 'right'
})

export const rows = style({ margin: 0, padding: 0, listStyle: 'none' })
