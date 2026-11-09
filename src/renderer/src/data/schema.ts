import { z } from 'zod'
import { ELEMENTS, type Element, type GameDef } from './games'

// Chip types and elements differ by game, so the schema is built per game and the types are
// written out; rotationSchemaFor's return type requires the schema's output to be assignable
// to them (one-way: a field the schema stops producing still typechecks).
// Every object is strict, so a mistyped key is an error, not silently dropped.

export type Chip = { type: string; label: string; key?: string }
type InlineNote = { note: string }
export type Step = (Chip | InlineNote)[]
export type Unit = {
  icon: string
  name: string
  summary?: string
  steps: Step[]
  note?: string
  element?: Element
}
export type Variant = { id: string; label: string; units: Unit[]; tips?: string[] }
export type RotationFile = { label: string; order?: number; variants: Variant[] }

export const isChip = (x: Chip | InlineNote): x is Chip => 'type' in x

const inlineNoteSchema = z.strictObject({ note: z.string() })

// `folder` names the game in messages; the registry entry has only its display name.
export function rotationSchemaFor(folder: string, game: GameDef): z.ZodType<RotationFile> {
  const types = Object.keys(game.chips)
  const allowed = types.join(', ')
  const chipSchema = z
    .strictObject({
      type: z.string().refine((t) => types.includes(t), {
        error: (iss) => `${String(iss.input)} is not a ${folder} chip (allowed: ${allowed})`
      }),
      label: z.string(),
      key: z.string().optional()
    })
    // the chip's own key wins; a type with no default stays keyless
    .transform((c): Chip => {
      const key = c.key ?? game.chips[c.type]?.key
      return key === undefined ? c : { ...c, key }
    })

  // Told apart by the `note` key. A plain z.union would report "Invalid input" on the whole item
  // instead of the failing field inside the chip or note that was meant.
  const stepItemSchema = z.unknown().transform((v, ctx): Chip | InlineNote => {
    const isNote = typeof v === 'object' && v !== null && 'note' in v
    const r = (isNote ? inlineNoteSchema : chipSchema).safeParse(v)
    if (r.success) return r.data
    for (const i of r.error.issues) {
      ctx.addIssue({ code: 'custom', path: i.path, message: i.message })
    }
    return z.NEVER
  })

  const unitShape = {
    icon: z.string(),
    name: z.string(),
    summary: z.string().optional(),
    steps: z.array(z.array(stepItemSchema)),
    note: z.string().optional()
  }
  // left out where the game has none, so strict reports an element as an unknown key
  const unitSchema = game.elements
    ? z.strictObject({ ...unitShape, element: z.enum(ELEMENTS).optional() })
    : z.strictObject(unitShape)

  const variantSchema = z.strictObject({
    id: z.string(),
    label: z.string(),
    units: z.array(unitSchema),
    tips: z.array(z.string()).optional()
  })

  return z.strictObject({
    label: z.string(),
    order: z.number().optional(),
    variants: z
      .array(variantSchema)
      .min(1)
      .refine((vs) => new Set(vs.map((v) => v.id)).size === vs.length, {
        error: 'variant ids must be unique within a file'
      })
  })
}
