import { style, type CSSProperties } from '@vanilla-extract/css'
import { vars } from '../../styles/theme.css'

// csstype has no -webkit-app-region, hence the cast
const noDrag = { WebkitAppRegion: 'no-drag' } as CSSProperties

export const picker = style({ display: 'flex', flexDirection: 'column', gap: vars.gap })

export const item = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.gap,
  width: '100%',
  padding: '8px 10px',
  border: `1px solid ${vars.line}`,
  borderRadius: '6px',
  background: vars.appPanel,
  color: vars.text,
  fontSize: '13px',
  fontWeight: 600,
  textAlign: 'left',
  cursor: 'pointer'
})

export const name = style({ flex: 1, minWidth: 0, overflowWrap: 'anywhere' })

export const count = style({
  color: vars.dim,
  fontSize: '11px',
  fontWeight: 400,
  whiteSpace: 'nowrap'
})

export const badge = style({
  color: vars.chip.heavy,
  fontSize: '11px',
  fontWeight: 600,
  whiteSpace: 'nowrap'
})

export const head = style({ display: 'flex', alignItems: 'center', gap: vars.gap })

export const heading = style({ margin: 0, color: vars.text, fontSize: '13px', fontWeight: 600 })

// one line tall; no-drag so it still clicks when its row is a window drag region
export const back = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '0 6px',
  border: 0,
  background: 'none',
  color: vars.dim,
  fontSize: '14px',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  ...noDrag
})

export const problems = style({ display: 'flex', flexDirection: 'column', gap: vars.gap })

export const empty = style({ margin: 0, color: vars.dim, fontSize: '12px' })
