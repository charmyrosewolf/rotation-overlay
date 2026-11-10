import { style } from '@vanilla-extract/css'
import { vars } from '../../styles/theme.css'

export const note = style({ fontSize: '12px', color: vars.dim })

export const block = style({ display: 'block', margin: 0, paddingTop: '2px' })
