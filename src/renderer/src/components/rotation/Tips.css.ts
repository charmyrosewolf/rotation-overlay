import { globalStyle, style } from '@vanilla-extract/css'
import { vars } from '../../styles/theme.css'

export const tips = style({ fontSize: '12px', color: vars.dim, padding: '4px 8px' })

globalStyle(`${tips} b`, { color: vars.text })
