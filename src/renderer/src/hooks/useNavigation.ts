import { useState } from 'react'
import {
  folderOf,
  groupByGame,
  idOf,
  type FileProblem,
  type GameGroup,
  type Loaded,
  type Team
} from '../data/loadRotations'
import type { Variant } from '../data/schema'
import { isString, isStringRecord, useStoredState } from './useStoredState'

export type Shown =
  | { screen: 'games'; games: GameGroup[]; other: FileProblem[] }
  | { screen: 'teams'; group: GameGroup; canBack: boolean }
  | { screen: 'rotation'; team: Team; variant: Variant }
  | { screen: 'broken'; teamId: string; problem: FileProblem }

// What was asked for. What is shown is worked out from it and the files on every render.
type View =
  | { screen: 'games' }
  | { screen: 'teams'; game: string }
  | { screen: 'rotation'; teamId: string }
type Ids = Record<string, string>

const GAMES: View = { screen: 'games' }

const findTeam = (loaded: Loaded, id: string) => loaded.ok.find((t) => t.id === id)
const findProblem = (loaded: Loaded, id: string) =>
  loaded.errors.find((e) => idOf(e.file) === id)

// With one game and no Other, the games step would offer a single choice, so it is
// skipped, and no teams screen goes back to it. `game` unset, or not present, is the games step.
function picker(loaded: Loaded, game?: string): Shown {
  const { games, other } = groupByGame(loaded)
  const skip = games.length === 1 && other.length === 0
  const group = skip ? games[0] : games.find((g) => g.id === game)
  return group ? { screen: 'teams', group, canBack: !skip } : { screen: 'games', games, other }
}

function resolve(view: View, loaded: Loaded, variantByTeam: Ids): Shown {
  if (view.screen === 'games') return picker(loaded)
  if (view.screen === 'teams') return picker(loaded, view.game)
  const id = view.teamId
  const team = findTeam(loaded, id)
  if (team) {
    // the schema rejects a file with no variants
    const variant = team.variants.find((v) => v.id === variantByTeam[id]) ?? team.variants[0]!
    return { screen: 'rotation', team, variant }
  }
  const problem = findProblem(loaded, id)
  if (problem) return { screen: 'broken', teamId: id, problem }
  return picker(loaded, folderOf(id))
}

export function useNavigation(loaded: Loaded): {
  shown: Shown
  errorCount: number
  pickGame(game: string): void
  pickTeam(teamId: string): void
  pickVariant(variantId: string): void
  back(): void
} {
  const [lastTeam, setLastTeam] = useStoredState('lastTeam', '', isString)
  const [teamByGame, setTeamByGame] = useStoredState<Ids>('teamByGame', {}, isStringRecord)
  const [variantByTeam, setVariantByTeam] = useStoredState<Ids>('variantByTeam', {}, isStringRecord)
  // Only the actions below change the view or storage, never what a load resolved to, so a
  // team missing for one bad save, or before the first load arrives, is back when its file is.
  const [view, setView] = useState<View>(() =>
    lastTeam ? { screen: 'rotation', teamId: lastTeam } : GAMES
  )
  const shown = resolve(view, loaded, variantByTeam)

  const isListed = (id: string) =>
    findTeam(loaded, id) !== undefined || findProblem(loaded, id) !== undefined

  const pickTeam = (teamId: string) => {
    setView({ screen: 'rotation', teamId })
    setLastTeam(teamId)
    setTeamByGame({ ...teamByGame, [folderOf(teamId) ?? '']: teamId })
  }

  // a gone team isn't picked: a relaunch opens the last rotation shown, and it never was
  const pickGame = (game: string) => {
    const remembered = teamByGame[game]
    if (remembered !== undefined && isListed(remembered)) pickTeam(remembered)
    else setView({ screen: 'teams', game })
  }

  const pickVariant = (variantId: string) => {
    if (shown.screen !== 'rotation') return
    setVariantByTeam({ ...variantByTeam, [shown.team.id]: variantId })
  }

  // from what is shown, not the view: a rotation that fell back to its teams goes on to games
  const back = () => {
    if (shown.screen === 'rotation') setView({ screen: 'teams', game: shown.team.game })
    else if (shown.screen === 'broken') {
      setView({ screen: 'teams', game: folderOf(shown.teamId) ?? '' })
    } else if (shown.screen === 'teams' && shown.canBack) setView(GAMES)
  }

  // a broken open team already shows its error where the cards were
  const errorCount = loaded.errors.length - (shown.screen === 'broken' ? 1 : 0)

  return { shown, errorCount, pickGame, pickTeam, pickVariant, back }
}
