import { z } from 'zod'

// zod is the source of truth; the exported types are inferred from it.
// Every object is strict, so a mistyped key is an error, not silently dropped.

export const ACTION_TYPES = ['basic', 'skill', 'echo', 'lib', 'heavy', 'io', 'move'] as const
export type ActionType = (typeof ACTION_TYPES)[number]

const chipSchema = z.strictObject({
  type: z.enum(ACTION_TYPES),
  label: z.string(),
  key: z.string().optional()
})
const inlineNoteSchema = z.strictObject({ note: z.string() })

export type Chip = z.infer<typeof chipSchema>
type InlineNote = z.infer<typeof inlineNoteSchema>

export const isChip = (x: Chip | InlineNote): x is Chip => 'type' in x

// Told apart by the `note` key. A plain z.union would report "Invalid input" on the whole item
// instead of the failing field inside the chip or note that was meant.
const stepItemSchema = z.unknown().transform((v, ctx): Chip | InlineNote => {
  const isNote = typeof v === 'object' && v !== null && 'note' in v
  const r = (isNote ? inlineNoteSchema : chipSchema).safeParse(v)
  if (r.success) return r.data
  for (const i of r.error.issues) ctx.addIssue({ code: 'custom', path: i.path, message: i.message })
  return z.NEVER
})

const stepSchema = z.array(stepItemSchema)
export type Step = z.infer<typeof stepSchema>

const unitSchema = z.strictObject({
  icon: z.string(),
  name: z.string(),
  summary: z.string().optional(),
  steps: z.array(stepSchema),
  note: z.string().optional()
})
export type Unit = z.infer<typeof unitSchema>

const variantSchema = z.strictObject({
  id: z.string(),
  label: z.string(),
  units: z.array(unitSchema),
  tips: z.array(z.string()).optional()
})
export type Variant = z.infer<typeof variantSchema>

export const rotationFileSchema = z.strictObject({
  label: z.string(),
  order: z.number().optional(),
  variants: z
    .array(variantSchema)
    .min(1)
    .refine((vs) => new Set(vs.map((v) => v.id)).size === vs.length, {
      error: 'variant ids must be unique within a file'
    })
})
export type RotationFile = z.infer<typeof rotationFileSchema>
