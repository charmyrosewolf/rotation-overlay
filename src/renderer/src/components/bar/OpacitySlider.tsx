import { useEffect } from 'react'
import { useStoredState } from '../../hooks/useStoredState'
import styles from './OpacitySlider.module.css'

type Props = {
  title: string
  cssVar: '--a' | '--c'
  storageKey: string
  fallback: number
}

// storage can hold any JSON; only a number in 0..1 is an alpha
const isAlpha = (v: unknown): v is number => typeof v === 'number' && v >= 0 && v <= 1

export function OpacitySlider({ title, cssVar, storageKey, fallback }: Props) {
  const [value, setValue] = useStoredState(storageKey, fallback, isAlpha)

  useEffect(() => {
    document.documentElement.style.setProperty(cssVar, String(value))
  }, [cssVar, value])

  return (
    <input
      type="range"
      className={styles.slider}
      min={0}
      max={1}
      step={0.05}
      title={title}
      value={value}
      onChange={(e) => setValue(Number(e.currentTarget.value))}
    />
  )
}
