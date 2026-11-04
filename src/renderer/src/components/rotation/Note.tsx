import { cx } from '../../styles/cx'
import styles from './Note.module.css'

type Props = { text: string; block?: boolean }

export function Note({ text, block = false }: Props) {
  return block ? (
    <p className={cx(styles.note, styles.block)}>{text}</p>
  ) : (
    <span className={styles.note}>{text}</span>
  )
}
