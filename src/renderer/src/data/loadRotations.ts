import type { RawFile } from '../../../preload/api'
import { GAMES } from './games'
import { rotationSchemaFor, type RotationFile } from './schema'

export type Team = RotationFile & { id: string; game: string }
export type FileProblem = { file: string; message: string }
export type Loaded = { ok: Team[]; errors: FileProblem[] }
export type GameGroup = { id: string; name: string; teams: Team[]; errors: FileProblem[] }
export type Grouped = { games: GameGroup[]; other: FileProblem[] }

// Built once per game, not per file: a hot reload re-parses every file on each save.
const schemas = new Map(
  Object.entries(GAMES).map(([id, game]) => [id, rotationSchemaFor(id, game)] as const)
)
const KNOWN = Object.keys(GAMES).join(', ')

// The game is the folder, the path up to the first `/`; a loose file has none.
export const folderOf = (file: string): string | undefined => {
  const i = file.indexOf('/')
  return i < 0 ? undefined : file.slice(0, i)
}

// A team's id is its file path minus .json, so folderOf works on an id too.
export const idOf = (file: string): string => file.replace(/\.json$/, '')

const toProblem = (file: string, issue: { path: PropertyKey[]; message: string }): FileProblem => {
  const path = issue.path.map(String).join('.')
  return { file, message: path ? `${path}: ${issue.message}` : issue.message }
}

// One bad file never takes the others down: each is parsed alone.
function parseOne(raw: RawFile): Team | FileProblem {
  const folder = folderOf(raw.file)
  if (folder === undefined) return { file: raw.file, message: 'needs a game folder' }
  const schema = schemas.get(folder)
  if (!schema) return { file: raw.file, message: `unknown game folder ${folder} (known: ${KNOWN})` }
  let json: unknown
  try {
    json = JSON.parse(raw.text)
  } catch (e) {
    return { file: raw.file, message: `JSON: ${(e as SyntaxError).message}` }
  }
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    // zod reports at least one issue on a failure; the default only satisfies the index type
    const [issue = { path: [], message: 'invalid' }] = parsed.error.issues
    return toProblem(raw.file, issue)
  }
  return { id: idOf(raw.file), game: folder, ...parsed.data }
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

// A game is listed once it has a file, even one that fails, so its errors stay findable.
// Every problem not filed under a game lands in `other`.
export function groupByGame({ ok, errors }: Loaded): Grouped {
  const games = Object.entries(GAMES)
    .map(([id, { name }]) => ({
      id,
      name,
      teams: ok.filter((t) => t.game === id),
      errors: errors.filter((e) => folderOf(e.file) === id)
    }))
    .filter((g) => g.teams.length > 0 || g.errors.length > 0)
    .sort((a, b) => cmp(a.id, b.id))
  const filed = new Set(games.flatMap((g) => g.errors))
  return { games, other: errors.filter((e) => !filed.has(e)) }
}
