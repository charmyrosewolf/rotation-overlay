import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RawFile } from '../../preload/api'
import { App } from './App'
import { installOverlay } from './test/overlay'
import { resetRootVars } from './test/rootVars'

const unit = (name: string) => ({
  icon: '🌀',
  name,
  steps: [[{ type: 'skill', label: 'Skill', key: 'E' }]]
})
const variant = (id: string, label: string, unitName: string) => ({
  id,
  label,
  units: [unit(unitName)]
})
const rotation = (name: string, body: object): RawFile => ({
  file: `wuwa/${name}.json`,
  text: JSON.stringify(body)
})

const standard = (u: string) => variant('standard', 'Standard', u)
const practice = variant('practice', 'Practice', 'B2')
const alpha = rotation('alpha', { label: 'Alpha', order: 1, variants: [standard('A1')] })
const beta = rotation('beta', { label: 'Beta', order: 2, variants: [standard('B1'), practice] })
const gamma = rotation('gamma', { label: 'Gamma', order: 3, variants: [standard('G1')] })

const stubOverlay = (files: RawFile[]) => installOverlay(() => Promise.resolve(files))

async function mountApp() {
  const { container } = render(<App />)
  await act(async () => {}) // lets list() resolve
  return container
}

const store = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value))
const teamTabs = () => within(screen.getByRole('navigation')).getAllByRole('button')
const pressed = (bs: HTMLElement[]) =>
  bs.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent)
const activeTeam = () => pressed(teamTabs())
const variantTab = (name: string) => screen.getByRole('button', { name })
const unitNames = () => screen.queryAllByRole('heading', { level: 2 }).map((h) => h.textContent)
const clickTeam = (name: string) =>
  userEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name }))
const appBar = () => screen.queryByTitle('close')
const popOut = () => screen.queryByTitle('open in a small popup window')

beforeEach(() => localStorage.clear())
afterEach(() => {
  delete window.overlay
  resetRootVars()
  vi.restoreAllMocks()
})

describe('App selection', () => {
  it('opens on the stored team and variant when both still exist', async () => {
    store('team', 'wuwa/beta')
    store('variant', 'practice')
    stubOverlay([alpha, beta])
    await mountApp()
    expect(activeTeam()).toEqual(['Beta'])
    expect(variantTab('Practice')).toHaveAttribute('aria-pressed', 'true')
    expect(unitNames()).toEqual(['🌀 B2'])
  })

  it('falls back to the first tab when the stored team is gone', async () => {
    store('team', 'wuwa/gone')
    stubOverlay([alpha, beta])
    await mountApp()
    expect(activeTeam()).toEqual(['Alpha'])
    expect(unitNames()).toEqual(['🌀 A1'])
  })

  it('falls back to the first tab when a push removes the selected team', async () => {
    const { push } = stubOverlay([alpha, beta])
    await mountApp()
    await clickTeam('Beta')
    push([alpha, gamma])
    expect(activeTeam()).toEqual(['Alpha'])
    expect(unitNames()).toEqual(['🌀 A1'])
  })

  // the fallback is never stored, so one bad save does not lose the pick
  it('returns to the picked team when a later push brings it back', async () => {
    const { push } = stubOverlay([alpha, beta])
    await mountApp()
    await clickTeam('Beta')
    push([alpha, gamma])
    push([alpha, beta, gamma])
    expect(activeTeam()).toEqual(['Beta'])
  })

  // gamma moves in front and practice moves down a slot, so a pick held by position drifts;
  // standard stays first, so a reset to the first variant shows too
  it('keeps the team and variant when a push keeps them', async () => {
    const { push } = stubOverlay([alpha, beta])
    await mountApp()
    await clickTeam('Beta')
    await userEvent.click(variantTab('Practice'))
    const gammaFirst = rotation('gamma', { label: 'Gamma', order: 0, variants: [standard('G1')] })
    const betaEdited = rotation('beta', {
      label: 'Beta v2',
      order: 2,
      variants: [standard('B1'), variant('extra', 'Extra', 'BX'), practice]
    })
    push([gammaFirst, alpha, betaEdited])
    expect(activeTeam()).toEqual(['Beta v2'])
    expect(variantTab('Practice')).toHaveAttribute('aria-pressed', 'true')
    expect(unitNames()).toEqual(['🌀 B2'])
  })

  it('opens a newly clicked team on its first variant', async () => {
    stubOverlay([alpha, beta])
    await mountApp()
    await clickTeam('Beta')
    await userEvent.click(variantTab('Practice'))
    await clickTeam('Alpha')
    await clickTeam('Beta')
    expect(variantTab('Standard')).toHaveAttribute('aria-pressed', 'true')
    expect(unitNames()).toEqual(['🌀 B1'])
  })

  it('keeps the variant when the open team is clicked again', async () => {
    stubOverlay([alpha, beta])
    await mountApp()
    await clickTeam('Beta')
    await userEvent.click(variantTab('Practice'))
    await clickTeam('Beta')
    expect(variantTab('Practice')).toHaveAttribute('aria-pressed', 'true')
    expect(unitNames()).toEqual(['🌀 B2'])
  })

  it('falls back to the first variant when the stored one is gone', async () => {
    store('team', 'wuwa/beta')
    store('variant', 'gone')
    stubOverlay([alpha, beta])
    await mountApp()
    expect(activeTeam()).toEqual(['Beta'])
    expect(variantTab('Standard')).toHaveAttribute('aria-pressed', 'true')
    expect(unitNames()).toEqual(['🌀 B1'])
  })

  it('stores the keys toggle as showKeys', async () => {
    stubOverlay([alpha])
    await mountApp()
    expect(screen.queryByText('E')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: 'keys' }))
    expect(screen.getByText('E')).toBeInTheDocument()
    expect(localStorage.getItem('showKeys')).toBe('true')
  })

  // truthy, so it would show the keys if it were taken as the boolean it is not
  it('hides the keys when the stored showKeys is not a boolean', async () => {
    store('showKeys', 'yes')
    stubOverlay([alpha])
    await mountApp()
    expect(screen.getByRole('checkbox', { name: 'keys' })).not.toBeChecked()
    expect(screen.queryByText('E')).not.toBeInTheDocument()
  })
})

describe('App files', () => {
  it('renders the valid team and a FileError naming the broken file', async () => {
    stubOverlay([alpha, { file: 'wuwa/broken.json', text: '{' }])
    await mountApp()
    expect(activeTeam()).toEqual(['Alpha'])
    expect(unitNames()).toEqual(['🌀 A1'])
    expect(screen.getByText('wuwa/broken.json')).toBeInTheDocument()
  })
})

describe('App modes', () => {
  it('in a browser: no app bar, and a pop-out that opens the 300×760 popup', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    await mountApp()
    expect(appBar()).not.toBeInTheDocument()
    expect(popOut()).toHaveTextContent('⧉ pop out')
    await userEvent.click(popOut()!)
    expect(open).toHaveBeenCalledExactlyOnceWith(
      location.href,
      'toa-rot',
      'popup,width=300,height=760'
    )
  })

  it('in the app: an app bar, and no pop-out', async () => {
    stubOverlay([alpha])
    await mountApp()
    expect(appBar()).toBeInTheDocument()
    expect(popOut()).not.toBeInTheDocument()
  })
})

describe('App collapse', () => {
  const bar = () => screen.getByTitle('expand').parentElement!

  it('hides the page and sends the body height, rounded up', async () => {
    const { overlay } = stubOverlay([alpha, beta])
    await mountApp()
    vi.spyOn(document.body, 'getBoundingClientRect').mockReturnValue({ height: 33.2 } as DOMRect)
    await userEvent.click(screen.getByTitle('collapse to a bar'))
    expect(overlay.collapse).toHaveBeenCalledExactlyOnceWith(34)
    expect(screen.getByRole('navigation', { hidden: true })).not.toBeVisible()
  })

  // the page's body background keys off this class
  it('marks its root collapsed while collapsed, and only then', async () => {
    stubOverlay([alpha])
    const container = await mountApp()
    const rootClass = () => container.firstElementChild?.className
    expect(rootClass()).not.toContain('collapsed')
    await userEvent.click(screen.getByTitle('collapse to a bar'))
    expect(rootClass()).toContain('collapsed')
    await userEvent.click(screen.getByTitle('expand'))
    expect(rootClass()).not.toContain('collapsed')
  })

  it('keeps the marked card through a collapse and an expand', async () => {
    const duo = rotation('duo', {
      label: 'Duo',
      order: 0,
      variants: [{ id: 'standard', label: 'Standard', units: [unit('D1'), unit('D2')] }]
    })
    stubOverlay([duo])
    await mountApp()
    const marked = () =>
      Array.from(document.querySelectorAll('section')).map((s) => s.className.includes('marked'))
    await userEvent.click(screen.getByRole('heading', { name: '🌀 D2' }))
    expect(marked()).toEqual([false, true])
    await userEvent.click(screen.getByTitle('collapse to a bar'))
    await userEvent.click(screen.getByTitle('expand'))
    expect(marked()).toEqual([false, true])
  })

  it('titles the bar with the team alone on its first variant', async () => {
    stubOverlay([alpha, beta])
    await mountApp()
    await userEvent.click(screen.getByTitle('collapse to a bar'))
    // exact match: 'Alpha · Standard' would not be found
    expect(within(bar()).getByText('Alpha')).toBeVisible()
  })

  it('titles the bar with team and variant on any other variant', async () => {
    stubOverlay([alpha, beta])
    await mountApp()
    await clickTeam('Beta')
    await userEvent.click(variantTab('Practice'))
    await userEvent.click(screen.getByTitle('collapse to a bar'))
    expect(within(bar()).getByText('Beta · Practice')).toBeVisible()
  })
})
