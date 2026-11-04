import type { RawFile } from '../../../preload/api'
import { rotationFileSchema, type RotationFile } from './schema'

export type Team = RotationFile & { id: string; game: string }
export type FileProblem = { file: string; message: string }
export type Loaded = { ok: Team[]; errors: FileProblem[] }

const toProblem = (file: string, issue: { path: PropertyKey[]; message: string }): FileProblem => {
  const path = issue.path.map(String).join('.')
  return { file, message: path ? `${path}: ${issue.message}` : issue.message }
}

// One bad file never takes the others down: each is parsed alone.
function parseOne(raw: RawFile): Team | FileProblem {
  // The game is the folder; a loose file has none to be filed under.
  if (!raw.file.includes('/')) return { file: raw.file, message: 'needs a game folder' }
  let json: unknown
  try {
    json = JSON.parse(raw.text)
  } catch (e) {
    return { file: raw.file, message: `JSON: ${(e as SyntaxError).message}` }
  }
  const parsed = rotationFileSchema.safeParse(json)
  if (!parsed.success) {
    // zod reports at least one issue on a failure; the default only satisfies the index type
    const [issue = { path: [], message: 'invalid' }] = parsed.error.issues
    return toProblem(raw.file, issue)
  }
  const id = raw.file.replace(/\.json$/, '')
  return { id, game: id.slice(0, id.indexOf('/')), ...parsed.data }
}

type Entry = { file: string; team: Team }

const cmp = <T extends string | number>(a: T, b: T): number => (a < b ? -1 : a > b ? 1 : 0)

// ?? not ||: an order of 0 is a real position, only a missing one goes last
const byGameOrderFile = (a: Entry, b: Entry): number =>
  cmp(a.team.game, b.team.game) ||
  cmp(a.team.order ?? Infinity, b.team.order ?? Infinity) ||
  cmp(a.file, b.file)

export function loadRotations(files: RawFile[]): Loaded {
  const entries: Entry[] = []
  const errors: FileProblem[] = []
  for (const raw of files) {
    const result = parseOne(raw)
    if ('variants' in result) entries.push({ file: raw.file, team: result })
    else errors.push(result)
  }
  return { ok: entries.sort(byGameOrderFile).map((e) => e.team), errors }
}
