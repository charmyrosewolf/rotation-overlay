import { style } from '@vanilla-extract/css'
import { vars } from '../../styles/theme.css'

export const error = style({
  padding: '6px 8px',
  border: `1px solid ${vars.chip.heavy}`,
  borderRadius: '6px',
  background: vars.appPanel,
  fontSize: '12px'
})

export const file = style({ color: vars.chip.heavy })

export const message = style({ marginTop: '2px', color: vars.dim, overflowWrap: 'anywhere' })
