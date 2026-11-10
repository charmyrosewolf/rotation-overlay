import * as styles from './KeysToggle.css'

type Props = { showKeys: boolean; onChange: (showKeys: boolean) => void }

export function KeysToggle({ showKeys, onChange }: Props) {
  return (
    <label className={styles.keys}>
      <input type="checkbox" checked={showKeys} onChange={(e) => onChange(e.target.checked)} /> keys
    </label>
  )
}
