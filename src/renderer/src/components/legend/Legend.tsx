import { ACTION_TYPES, type ActionType } from '../../data/schema'
import { ActionChip } from '../rotation/ActionChip'
import styles from './Legend.module.css'

// Record, so a new action type fails to compile until it has a label
const LABELS: Record<ActionType, string> = {
  basic: 'Basic',
  skill: 'Skill',
  echo: 'Echo',
  lib: 'Lib',
  heavy: 'Heavy/Forte',
  io: 'Intro/Outro',
  move: 'Move'
}

export function Legend() {
  return (
    <div className={styles.legend}>
      {ACTION_TYPES.map((type) => (
        <ActionChip key={type} chip={{ type, label: LABELS[type] }} showKeys={false} small />
      ))}
    </div>
  )
}
