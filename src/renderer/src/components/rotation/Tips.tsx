import { Fragment, type ReactNode } from 'react'
import * as styles from './Tips.css'

// split() with a capture group alternates text / captured, so odd parts are the bold ones.
// Only text nodes and <b> are ever built; nothing is parsed as HTML.
const bold = (tip: string): ReactNode[] =>
  tip.split(/\*\*(.+?)\*\*/).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part))

type Props = { tips: string[] }

export function Tips({ tips }: Props) {
  return (
    <div className={styles.tips}>
      {tips.map((tip, i) => (
        <Fragment key={i}>
          {i > 0 && ' · '}
          {bold(tip)}
        </Fragment>
      ))}
    </div>
  )
}
