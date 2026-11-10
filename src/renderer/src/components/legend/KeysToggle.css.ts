import { style } from '@vanilla-extract/css'
import { vars } from '../../styles/theme.css'

export const keys = style({
  fontSize: '12px',
  color: vars.dim,
  whiteSpace: 'nowrap',
  cursor: 'pointer'
})
