import type { Unit } from '../../data/schema'
import { cx } from '../../styles/cx'
import { Note } from './Note'
import { StepRow } from './StepRow'
import styles from './UnitCard.module.css'

type Props = { unit: Unit; showKeys: boolean; marked: boolean; onClick: () => void }

export function UnitCard({ unit, showKeys, marked, onClick }: Props) {
  const cls = cx(styles.card, marked && styles.marked, unit.element && styles[unit.element])
  return (
    <section className={cls} onClick={onClick}>
      <h2 className={styles.title}>
        <span>
          {unit.icon} {unit.name}
        </span>
        {unit.summary ? <small className={styles.summary}>{unit.summary}</small> : null}
      </h2>
      <ul className={styles.rows}>
        {unit.steps.map((step, i) => (
          <StepRow key={i} step={step} n={i + 1} showKeys={showKeys} />
        ))}
      </ul>
      {unit.note ? <Note text={unit.note} block /> : null}
    </section>
  )
}
