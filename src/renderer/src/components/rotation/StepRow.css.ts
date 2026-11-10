import { style } from '@vanilla-extract/css'
import { vars } from '../../styles/theme.css'

export const row = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '3px',
  padding: '2px 0',
  selectors: { '& + &': { borderTop: `1px solid ${vars.line}` } }
})

export const n = style({ width: '14px', color: vars.dim, fontSize: '12px' })
