import { cx } from '../../styles/cx'
import * as styles from './Note.css'

type Props = { text: string; block?: boolean }

export function Note({ text, block = false }: Props) {
  return block ? (
    <p className={cx(styles.note, styles.block)}>{text}</p>
  ) : (
    <span className={styles.note}>{text}</span>
  )
}
