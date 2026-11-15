import { isChip, type Step } from '../../data/schema'
import { ActionChip } from './ActionChip'
import { Note } from './Note'
import * as styles from './StepRow.css'

type Props = { step: Step; n: number }

// The number is plain text from `n`; <ol> numbering would be read out twice.
export function StepRow({ step, n }: Props) {
  return (
    <li className={styles.row}>
      <span className={styles.n}>{n}</span>
      {step.map((item, i) =>
        isChip(item) ? (
          <ActionChip key={i} chip={item} />
        ) : (
          <Note key={i} text={item.note} />
        )
      )}
    </li>
  )
}
