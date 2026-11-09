import type { FileProblem, GameGroup } from '../../data/loadRotations'
import { FileError } from '../rotation/FileError'
import styles from './Picker.module.css'

const warning = (n: number) => `⚠ ${n}`

type ProblemsProps = { problems: FileProblem[] }

function Problems({ problems }: ProblemsProps) {
  return (
    <div className={styles.problems}>
      {problems.map((problem) => (
        <FileError key={problem.file} problem={problem} />
      ))}
    </div>
  )
}

type GameListProps = { games: GameGroup[]; other: FileProblem[]; onPick(game: string): void }

export function GameList({ games, other, onPick }: GameListProps) {
  if (games.length === 0 && other.length === 0) {
    return <p className={styles.empty}>No rotations found in rotations/</p>
  }
  return (
    <div className={styles.picker}>
      {games.map((game) => (
        <button key={game.id} type="button" className={styles.item} onClick={() => onPick(game.id)}>
          <span className={styles.name}>{game.name}</span>
          <span className={styles.count}>
            {game.teams.length} {game.teams.length === 1 ? 'team' : 'teams'}
          </span>
          {game.errors.length > 0 && (
            <span className={styles.badge}>{warning(game.errors.length)}</span>
          )}
        </button>
      ))}
      {other.length > 0 && (
        <>
          <h2 className={styles.heading}>Other</h2>
          <Problems problems={other} />
        </>
      )}
    </div>
  )
}

type TeamListProps = { group: GameGroup; onPick(teamId: string): void; onBack?: () => void }

export function TeamList({ group, onPick, onBack }: TeamListProps) {
  return (
    <div className={styles.picker}>
      <div className={styles.head}>
        {/* no count: the group's errors are listed below, so the badge would repeat them */}
        {onBack && <BackButton errorCount={0} onClick={onBack} />}
        <h2 className={styles.heading}>{group.name}</h2>
      </div>
      {group.teams.map((team) => (
        <button
          key={team.id}
          type="button"
          className={styles.item}
          onClick={() => onPick(team.id)}
        >
          <span className={styles.name}>{team.label}</span>
        </button>
      ))}
      {group.errors.length > 0 && <Problems problems={group.errors} />}
    </div>
  )
}

type BackButtonProps = { errorCount: number; onClick(): void }

export function BackButton({ errorCount, onClick }: BackButtonProps) {
  return (
    <button type="button" className={styles.back} title="back to the picker" onClick={onClick}>
      ‹
      {errorCount > 0 && <span className={styles.badge}>{warning(errorCount)}</span>}
    </button>
  )
}
