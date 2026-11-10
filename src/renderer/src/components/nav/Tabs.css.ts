import { style } from '@vanilla-extract/css'
import { vars } from '../../styles/theme.css'

export const tabs = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px',
  marginBottom: vars.gap
})

export const tab = style({
  flex: '1 1 auto',
  padding: '4px 8px',
  border: `1px solid ${vars.line}`,
  borderRadius: '6px',
  background: vars.appPanel,
  color: vars.dim,
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer'
})

export const active = style({
  background: vars.chip.lib,
  borderColor: vars.chip.lib,
  color: vars.chipInk
})
