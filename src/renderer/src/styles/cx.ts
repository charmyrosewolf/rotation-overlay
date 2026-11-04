type ClassName = string | false | null | undefined

// joins the class names that are set, so `cond && styles.x` can sit in the list
export const cx = (...names: ClassName[]): string => names.filter(Boolean).join(' ')
