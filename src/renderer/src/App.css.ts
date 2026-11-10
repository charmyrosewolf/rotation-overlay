import { globalStyle, style } from '@vanilla-extract/css'
import { vars } from './styles/theme.css'

// no rules of their own: the page background below keys off them
export const app = style({})
export const collapsed = style({})

// browser: an opaque page with flat text
export const browser = style({
  vars: { [vars.appPanel]: vars.card, [vars.appTextShadow]: 'none' }
})

// app: the window is transparent, so the page lets the game through at --a; collapsed, it is
// denser so the bar's title stays readable. html + :where keeps both at (0,0,2): over the body
// rule in the global styles, and the collapsed one wins by order
globalStyle(`html body:where(:has(${app}))`, { background: vars.appBg })
globalStyle(`html body:where(:has(${app}${collapsed}))`, { background: vars.appBgCollapsed })

export const top = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: vars.gap,
  marginBottom: vars.gap
})

// the picker's row holds only the pop-out, kept on the right where the rotation row has it
export const end = style({ justifyContent: 'flex-end' })

export const pop = style({
  padding: '2px 6px',
  border: `1px solid ${vars.line}`,
  borderRadius: '6px',
  background: vars.card,
  color: vars.dim,
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap'
})
