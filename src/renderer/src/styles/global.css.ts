import { globalStyle } from '@vanilla-extract/css'
import { vars } from './theme.css'

globalStyle('*', { boxSizing: 'border-box' })

globalStyle('body', {
  margin: 0,
  padding: '8px',
  background: vars.bg,
  color: vars.text,
  font: '14px/1.35 system-ui, "Segoe UI", sans-serif'
})

// the page font on buttons, at the line-height the UA gives them
globalStyle('button', { font: 'inherit', lineHeight: 'normal' })
