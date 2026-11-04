const root = document.documentElement.style

export const rootVar = (name: string) => root.getPropertyValue(name)

// the opacity sliders write --a and --c on the root, which outlives a test
export const resetRootVars = () => {
  root.removeProperty('--a')
  root.removeProperty('--c')
}
