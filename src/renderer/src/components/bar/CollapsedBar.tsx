type Props = { teamLabel: string; variantLabel?: string }

// Text only: AppBar's title slot supplies the ellipsis.
export function CollapsedBar({ teamLabel, variantLabel }: Props) {
  return <>{variantLabel ? `${teamLabel} · ${variantLabel}` : teamLabel}</>
}
