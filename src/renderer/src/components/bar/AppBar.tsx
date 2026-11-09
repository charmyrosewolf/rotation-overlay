import type { ReactNode } from 'react'
import { cx } from '../../styles/cx'
import styles from './AppBar.module.css'
import { OpacitySlider } from './OpacitySlider'

// title is a node so the collapsed label can be a <CollapsedBar>; a plain string works too.
// leading goes before the drag handle, and only while expanded.
type Props = { title: ReactNode; collapsed: boolean; onToggle(): void; leading?: ReactNode }

export function AppBar({ title, collapsed, onToggle, leading }: Props) {
  return (
    <div className={cx(styles.bar, collapsed && styles.collapsed)}>
      {!collapsed && leading}
      <span>⠿ drag</span>
      {/* hidden, not unmounted: the sliders' live state has to outlive a collapse */}
      <div className={styles.sliders} hidden={collapsed}>
        <OpacitySlider
          title="background opacity"
          cssVar="--a"
          storageKey="bgAlpha"
          fallback={0.4}
        />
        <OpacitySlider
          title="card opacity"
          cssVar="--c"
          storageKey="cardAlpha"
          fallback={0.6}
        />
      </div>
      {collapsed && <span className={styles.title}>{title}</span>}
      <button
        type="button"
        title={collapsed ? 'expand' : 'collapse to a bar'}
        onClick={onToggle}
      >
        {collapsed ? '▢' : '–'}
      </button>
      <button type="button" title="close" onClick={() => window.close()}>
        ✕
      </button>
    </div>
  )
}
