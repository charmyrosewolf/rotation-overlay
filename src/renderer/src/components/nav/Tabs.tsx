import { cx } from '../../styles/cx'
import styles from './Tabs.module.css'

type Props = {
  items: { id: string; label: string }[]
  activeId: string
  onSelect(id: string): void
  // the team tabs are the page's navigation; the variant tabs are only a row of buttons
  as?: 'nav' | 'div'
}

export function Tabs({ items, activeId, onSelect, as: Root = 'div' }: Props) {
  return (
    <Root className={styles.tabs}>
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
    </Root>
  )
}
