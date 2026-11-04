import type { Chip } from '../../data/schema'
import { cx } from '../../styles/cx'
import styles from './ActionChip.module.css'

type Props = { chip: Chip; showKeys: boolean; small?: boolean }

// The key is a real element, not ::after, so showKeys off leaves it out of the DOM.
export function ActionChip({ chip, showKeys, small = false }: Props) {
  return (
    <span className={cx(styles.chip, styles[chip.type], small && styles.small)}>
      {chip.label}
      {showKeys && chip.key ? <span className={styles.key}>{chip.key}</span> : null}
    </span>
  )
}
