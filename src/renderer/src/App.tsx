import { WINDOW_SIZE } from '../../shared/window'
import styles from './App.module.css'
import { AppBar } from './components/bar/AppBar'
import { CollapsedBar } from './components/bar/CollapsedBar'
import { KeysToggle } from './components/legend/KeysToggle'
import { Legend } from './components/legend/Legend'
import { Tabs } from './components/nav/Tabs'
import { FileError } from './components/rotation/FileError'
import { TeamView } from './components/rotation/TeamView'
import { useCollapse } from './hooks/useCollapse'
import { useRotations } from './hooks/useRotations'
import { isBoolean, isString, useStoredState } from './hooks/useStoredState'
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

export function App() {
  // the preload sets this before any script runs, so it never changes under a mounted app
  const appMode = window.overlay !== undefined
  const { ok, errors } = useRotations()
  const [teamId, setTeamId] = useStoredState('team', '', isString)
  const [variantId, setVariantId] = useStoredState('variant', '', isString)
  const [showKeys, setShowKeys] = useStoredState('showKeys', false, isBoolean)
  const { collapsed, toggle } = useCollapse(measureBody)

  // derived, never written back: a team gone for one bad save comes back selected
  const team = ok.find((t) => t.id === teamId) ?? ok[0]
  const variant = team?.variants.find((v) => v.id === variantId) ?? team?.variants[0]

  const selectTeam = (id: string) => {
    // a new team opens on its first variant; clicking the open one keeps its variant
    if (id !== team?.id) setVariantId(ok.find((t) => t.id === id)?.variants[0]?.id ?? '')
    setTeamId(id)
  }

  return (
    <div className={cx(appMode ? styles.app : styles.browser, collapsed && styles.collapsed)}>
      {appMode && (
        <AppBar
          title={
            team &&
            variant && (
              <CollapsedBar
                teamLabel={team.label}
                variantLabel={variant === team.variants[0] ? undefined : variant.label}
              />
            )
          }
          collapsed={collapsed}
          onToggle={toggle}
        />
      )}
      {/* hidden, not unmounted, so the marked card outlives a collapse */}
      <div hidden={collapsed}>
        {team && <Tabs as="nav" items={ok} activeId={team.id} onSelect={selectTeam} />}
        <div className={styles.top}>
          <Legend />
          <KeysToggle showKeys={showKeys} onChange={setShowKeys} />
          {!appMode && (
            <button
              type="button"
              className={styles.pop}
              title="open in a small popup window"
              onClick={popOut}
            >
              ⧉ pop out
            </button>
          )}
        </div>
        {errors.length > 0 && (
          <div className={styles.errors}>
            {errors.map((problem) => (
              <FileError key={problem.file} problem={problem} />
            ))}
          </div>
        )}
        {team && variant && (
          <TeamView
            team={team}
            variant={variant}
            onSelectVariant={setVariantId}
            showKeys={showKeys}
          />
        )}
      </div>
    </div>
  )
}
