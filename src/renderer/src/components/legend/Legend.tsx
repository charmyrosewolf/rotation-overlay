import { GAMES } from '../../data/games'
import { ActionChip } from '../rotation/ActionChip'
import styles from './Legend.module.css'

export function Legend({ game }: { game: string }) {
  const chips = Object.entries(GAMES[game]?.chips ?? {})
  return (
    <div className={styles.legend}>
      {chips.map(([type, def]) => (
        <ActionChip
          key={type}
          chip={{ type, label: def.label }}
          title={def.title}
          showKeys={false}
          small
        />
      ))}
    </div>
  )
}
