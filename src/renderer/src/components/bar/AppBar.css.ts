import { globalStyle, style, type CSSProperties } from '@vanilla-extract/css'
import { vars } from '../../styles/theme.css'

// csstype has no -webkit-app-region, hence the cast
const appRegion = (value: 'drag' | 'no-drag') => ({ WebkitAppRegion: value }) as CSSProperties

export const bar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.gap,
  margin: `-4px 0 ${vars.gap}`,
  fontSize: '12px',
  color: vars.dim,
  ...appRegion('drag'),
  cursor: 'move'
})

// collapsed: the bar is the whole window
export const collapsed = style({ margin: 0 })

globalStyle(`${bar} input, ${bar} button`, appRegion('no-drag'))

export const sliders = style({
  display: 'flex',
  flex: 1,
  minWidth: 0,
  gap: vars.gap,
  selectors: {
    // the display above would otherwise beat the UA's [hidden] rule
    '&[hidden]': { display: 'none' }
  }
})

export const title = style({
  flex: 1,
  minWidth: 0,
  color: vars.text,
  fontWeight: 600,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis'
})

globalStyle(`${bar} button`, {
  border: 0,
  background: 'none',
  color: vars.dim,
  // the UA's button font family: the glyphs are sized for it; the page's font stack adds 2px
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  cursor: 'pointer'
})
