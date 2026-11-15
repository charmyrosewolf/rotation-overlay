import type { ChipType } from '../../data/games'
import type { Chip } from '../../data/schema'
import { chip as chipStyle, key, keyTop } from './ActionChip.css'

type Props = {
  chip: Chip
  showKeys: boolean
  small?: boolean
  title?: string
  keyOnTop?: boolean
}

// The key is a real element, not ::after, so showKeys off leaves it out of the DOM.
export function ActionChip({ chip, showKeys, small = false, title, keyOnTop = false }: Props) {
  const badge =
    showKeys && chip.key ? <span className={keyOnTop ? keyTop : key}>{chip.key}</span> : null
  return (
    // the schema has already rejected a type outside the game, so the cast is safe here
    <span
      className={chipStyle({ type: chip.type as ChipType, small, stacked: keyOnTop })}
      title={title}
    >
      {keyOnTop && badge}
      {chip.label}
      {!keyOnTop && badge}
    </span>
  )
}
