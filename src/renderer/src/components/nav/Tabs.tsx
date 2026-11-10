import { cx } from '../../styles/cx'
import * as styles from './Tabs.css'

type Props = {
  items: { id: string; label: string }[]
  activeId: string
  onSelect(id: string): void
}

export function Tabs({ items, activeId, onSelect }: Props) {
  return (
    <div className={styles.tabs}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cx(styles.tab, item.id === activeId && styles.active)}
          aria-pressed={item.id === activeId}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
