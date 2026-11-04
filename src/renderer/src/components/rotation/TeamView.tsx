import { useState } from 'react'
import type { Team } from '../../data/loadRotations'
import type { Variant } from '../../data/schema'
import { Tabs } from '../nav/Tabs'
import { Tips } from './Tips'
import { UnitCard } from './UnitCard'

type Props = {
  team: Team
  variant: Variant
  onSelectVariant(id: string): void
  showKeys: boolean
}

type UnitsProps = { variant: Variant; showKeys: boolean }

// Holds the mark. TeamView keys it on team + variant, so a switch remounts it unmarked.
function Units({ variant, showKeys }: UnitsProps) {
  const [marked, setMarked] = useState<number | null>(null)
  return (
    <>
      {variant.units.map((unit, i) => (
        <UnitCard
          key={i}
          unit={unit}
          showKeys={showKeys}
          marked={marked === i}
          onClick={() => setMarked(i)}
        />
      ))}
    </>
  )
}

export function TeamView({ team, variant, onSelectVariant, showKeys }: Props) {
  return (
    <div>
      {/* nothing to switch between with one variant */}
      {team.variants.length > 1 && (
        <Tabs items={team.variants} activeId={variant.id} onSelect={onSelectVariant} />
      )}
      <Units key={JSON.stringify([team.id, variant.id])} variant={variant} showKeys={showKeys} />
      {variant.tips?.length ? <Tips tips={variant.tips} /> : null}
    </div>
  )
}
