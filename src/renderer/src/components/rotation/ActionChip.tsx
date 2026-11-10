import type { ChipType } from '../../data/games'
import type { Chip } from '../../data/schema'
import { chip as chipStyle, key } from './ActionChip.css'

type Props = {
  chip: Chip
  showKeys: boolean
  small?: boolean
  title?: string
}

// The key is a real element, not ::after, so showKeys off leaves it out of the DOM.
export function ActionChip({ chip, showKeys, small = false, title }: Props) {
  return (
    // the schema has already rejected a type outside the game, so the cast is safe here
    <span className={chipStyle({ type: chip.type as ChipType, small })} title={title}>
      {chip.label}
      {showKeys && chip.key ? <span className={key}>{chip.key}</span> : null}
    </span>
  )
}
