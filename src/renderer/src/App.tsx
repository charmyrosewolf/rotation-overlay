import type { ReactNode } from 'react'
import { WINDOW_SIZE } from '../../shared/window'
import * as styles from './App.css'
import { AppBar } from './components/bar/AppBar'
import { CollapsedBar } from './components/bar/CollapsedBar'
import { KeysToggle } from './components/legend/KeysToggle'
import { Legend } from './components/legend/Legend'
import { BackButton, GameList, TeamList } from './components/picker/Picker'
import { FileError } from './components/rotation/FileError'
import { TeamView } from './components/rotation/TeamView'
import { useCollapse } from './hooks/useCollapse'
import { useNavigation, type Shown } from './hooks/useNavigation'
import { useRotations } from './hooks/useRotations'
import { isBoolean, useStoredState } from './hooks/useStoredState'
import { cx } from './styles/cx'

// collapsed, the page is only the bar, so the body is the bar plus its own padding
const measureBody = () => document.body.getBoundingClientRect().height

// a popup dodges the browser's minimum width for normal windows
const popOut = () =>
  window.open(
    window.location.href,
    'toa-rot',
    `popup,width=${WINDOW_SIZE.width},height=${WINDOW_SIZE.height}`
  )

function PopOut() {
  return (
    <button
      type="button"
      className={styles.pop}
      title="open in a small popup window"
      onClick={popOut}
    >
      ⧉ pop out
    </button>
  )
}

function barTitle(shown: Shown): ReactNode {
  switch (shown.screen) {
    case 'rotation': {
      const { team, variant } = shown
      const variantLabel = variant === team.variants[0] ? undefined : variant.label
      return <CollapsedBar teamLabel={team.label} variantLabel={variantLabel} />
    }
    case 'broken':
      return shown.problem.file
    default:
      return 'pick a rotation'
  }
}

export function App() {
  // the preload sets this before any script runs, so it never changes under a mounted app
  const appMode = window.overlay !== undefined
  const loaded = useRotations()
  const { shown, errorCount, pickGame, pickTeam, pickVariant, back } = useNavigation(loaded)
  const [showKeys, setShowKeys] = useStoredState('showKeys', false, isBoolean)
  const { collapsed, toggle } = useCollapse(measureBody)

  // the app bar holds it in the app; a browser has no bar, so it heads the top row
  const onTeam = shown.screen === 'rotation' || shown.screen === 'broken'
  const backButton = onTeam && <BackButton errorCount={errorCount} onClick={back} />

  const pickerTop = !appMode && (
    <div className={cx(styles.top, styles.end)}>
      <PopOut />
    </div>
  )
  // a broken file has no chips to explain, so it gets no legend
  const teamTop = (legend?: ReactNode) => (
    <div className={styles.top}>
      {!appMode && backButton}
      {legend}
      <KeysToggle showKeys={showKeys} onChange={setShowKeys} />
      {!appMode && <PopOut />}
    </div>
  )

  return (
    <div className={cx(appMode ? styles.app : styles.browser, collapsed && styles.collapsed)}>
      {appMode && (
        <AppBar
          leading={backButton}
          title={barTitle(shown)}
          collapsed={collapsed}
          onToggle={toggle}
        />
      )}
      {/* hidden, not unmounted, so the marked card outlives a collapse */}
      <div hidden={collapsed}>
        {shown.screen === 'games' && (
          <>
            {pickerTop}
            <GameList games={shown.games} other={shown.other} onPick={pickGame} />
          </>
        )}
        {shown.screen === 'teams' && (
          <>
            {pickerTop}
            <TeamList
              group={shown.group}
              onPick={pickTeam}
              onBack={shown.canBack ? back : undefined}
            />
          </>
        )}
        {shown.screen === 'rotation' && (
          <>
            {teamTop(<Legend game={shown.team.game} />)}
            <TeamView
              team={shown.team}
              variant={shown.variant}
              onSelectVariant={pickVariant}
              showKeys={showKeys}
            />
          </>
        )}
        {shown.screen === 'broken' && (
          <>
            {teamTop()}
            <FileError problem={shown.problem} />
          </>
        )}
      </div>
    </div>
  )
}
