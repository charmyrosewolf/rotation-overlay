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
          chip={{ type, label: def.label, key: def.key }}
          title={def.title}
          showKeys
          small
          keyOnTop
        />
      ))}
    </div>
  )
}
