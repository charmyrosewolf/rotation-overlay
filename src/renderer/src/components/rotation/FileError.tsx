import type { FileProblem } from '../../data/loadRotations'
import * as styles from './FileError.css'

type Props = { problem: FileProblem }

export function FileError({ problem }: Props) {
  return (
    <div className={styles.error}>
      <b className={styles.file}>{problem.file}</b>
      <div className={styles.message}>{problem.message}</div>
    </div>
  )
}
