import { useCallback, useEffect, useRef, useState } from 'react'

// Collapsed state is not stored: the window always opens expanded.
export function useCollapse(measure: () => number): { collapsed: boolean; toggle(): void } {
  const [collapsed, setCollapsed] = useState(false)
  // what the window was last told, so mount, StrictMode's second effect run and a new measure
  // function (a dep of the effect) send nothing
  const told = useRef(false)

  // effect, not the click: the bar has to be on screen before it is measured
  useEffect(() => {
    if (told.current === collapsed) return
    told.current = collapsed
    if (collapsed) window.overlay?.collapse(Math.ceil(measure()))
    else window.overlay?.expand()
  }, [collapsed, measure])

  const toggle = useCallback(() => setCollapsed((c) => !c), [])
  return { collapsed, toggle }
}
