import { GAMES } from '../../data/games'
import { ActionChip } from '../rotation/ActionChip'
import { legend } from './Legend.css'

export function Legend({ game }: { game: string }) {
  const chips = Object.entries(GAMES[game]?.chips ?? {})
  return (
    <div className={legend}>
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
