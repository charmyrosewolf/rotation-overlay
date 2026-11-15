import type { ChipType } from '../../data/games'
import type { Chip } from '../../data/schema'
import { chip as chipStyle, key } from './ActionChip.css'

type Props = {
  chip: Chip
  small?: boolean
  title?: string
}

// A real element, not ::after, so a keyless chip has no badge in the DOM.
export function ActionChip({ chip, small = false, title }: Props) {
  return (
    // the schema has already rejected a type outside the game, so the cast is safe here
    <span className={chipStyle({ type: chip.type as ChipType, small })} title={title}>
      {chip.label}
      {chip.key && <span className={key}>{chip.key}</span>}
    </span>
  )
}
