import { useCallback, useState } from 'react'

type Guard<T> = (v: unknown) => v is T

export const isString: Guard<string> = (v) => typeof v === 'string'
export const isBoolean: Guard<boolean> = (v) => typeof v === 'boolean'

// localStorage can throw (private mode, blocked) or hold junk or a value of another type;
// any of those gives the default
function read<T>(key: string, initial: T, isValid: Guard<T>): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return initial
    const parsed: unknown = JSON.parse(raw)
    return isValid(parsed) ? parsed : initial
  } catch {
    return initial
  }
}

export function useStoredState<T>(
  key: string,
  initial: T,
  isValid: Guard<T>
): [T, (v: T) => void] {
  const [value, setValue] = useState(() => read(key, initial, isValid))

  const set = useCallback(
    (v: T) => {
      setValue(v)
      try {
        localStorage.setItem(key, JSON.stringify(v))
      } catch {
        // not persisted; the state still holds it for this session
      }
    },
    [key]
  )

  return [value, set]
}
