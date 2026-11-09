import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RawFile } from '../../preload/api'
import { App } from './App'
import { installOverlay } from './test/overlay'
import { resetRootVars } from './test/rootVars'

// `skill` is a chip in both games, so one builder serves genshin/ and wuwa/
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
const rotation = (game: string, name: string, body: object): RawFile => ({
  file: `${game}/${name}.json`,
  text: JSON.stringify(body)
})
const broken = (file: string): RawFile => ({ file, text: '{' })

const standard = (u: string) => variant('standard', 'Standard', u)
const practice = variant('practice', 'Practice', 'B2')
const alpha = rotation('wuwa', 'alpha', { label: 'Alpha', order: 1, variants: [standard('A1')] })
const beta = rotation('wuwa', 'beta', {
  label: 'Beta',
  order: 2,
  variants: [standard('B1'), practice]
})
const gamma = rotation('wuwa', 'gamma', { label: 'Gamma', order: 3, variants: [standard('G1')] })
// shares beta's variant ids, so a variant remembered for one team and read for another shows
const delta = rotation('wuwa', 'delta', {
  label: 'Delta',
  order: 4,
  variants: [standard('D1'), variant('practice', 'Practice', 'D2')]
})
// a second game, so the game list shows and "its game's teams" can be told from the only ones
const skirk = rotation('genshin', 'skirk', { label: 'Skirk', order: 1, variants: [standard('S1')] })

// no overlay means the bundled rotations/ load, so a browser test opens one of its real files
const [bundled = ''] = Object.keys(import.meta.glob('../../../rotations/wuwa/*.json'))
const bundledTeam = bundled.replace(/^(\.\.\/)*rotations\//, '').replace(/\.json$/, '')

const stubOverlay = (files: RawFile[]) => installOverlay(() => Promise.resolve(files))

async function mountApp() {
  const { container } = render(<App />)
  await act(async () => {}) // lets list() resolve
  return container
}

const store = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value))
const variantTab = (name: string) => screen.getByRole('button', { name })
// a card is a section headed by its unit; the picker's headings are not in one
const unitNames = () => Array.from(document.querySelectorAll('section h2'), (h) => h.textContent)
const pick = (name: string | RegExp) => userEvent.click(screen.getByRole('button', { name }))
const back = () => screen.getByTitle('back to the picker')
const clickBack = () => userEvent.click(back())
const wuwaTeams = () => screen.queryByRole('heading', { name: 'Wuthering Waves' })
const gameButtons = () =>
  screen.queryAllByRole('button', { name: /Genshin Impact|Wuthering Waves/ })
const appBar = () => screen.queryByTitle('close')
const popOut = () => screen.queryByTitle('open in a small popup window')

beforeEach(() => localStorage.clear())
afterEach(() => {
  delete window.overlay
  resetRootVars()
  vi.restoreAllMocks()
})

describe('App launch', () => {
  it('opens on the stored team and variant when both still exist', async () => {
    store('lastTeam', 'wuwa/beta')
    store('variantByTeam', { 'wuwa/beta': 'practice' })
    stubOverlay([alpha, beta])
    await mountApp()
    expect(variantTab('Practice')).toHaveAttribute('aria-pressed', 'true')
    expect(unitNames()).toEqual(['🌀 B2'])
  })

  it("opens the stored team's game's teams when the team is gone", async () => {
    store('lastTeam', 'wuwa/gone')
    stubOverlay([alpha, beta, skirk])
    await mountApp()
    expect(wuwaTeams()).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Beta' })).toBeInTheDocument()
    expect(unitNames()).toEqual([])
  })

  it('falls back to the first variant when the stored one is gone', async () => {
    store('lastTeam', 'wuwa/beta')
    store('variantByTeam', { 'wuwa/beta': 'gone' })
    stubOverlay([alpha, beta])
    await mountApp()
    expect(variantTab('Standard')).toHaveAttribute('aria-pressed', 'true')
    expect(unitNames()).toEqual(['🌀 B1'])
  })

  // the picker lists the same error, so the keys toggle tells the two screens apart
  it("opens a stored team whose file is broken on that file's error, with no legend", async () => {
    store('lastTeam', 'wuwa/beta')
    stubOverlay([alpha, broken('wuwa/beta.json')])
    await mountApp()
    expect(screen.getByText('wuwa/beta.json')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'keys' })).toBeInTheDocument()
    expect(screen.queryByTitle('Basic Attack')).not.toBeInTheDocument()
  })

  it('ignores the old team and variant keys', async () => {
    store('team', 'wuwa/beta')
    store('variant', 'practice')
    stubOverlay([alpha, beta, skirk])
    await mountApp()
    expect(gameButtons()).toHaveLength(2)
    expect(unitNames()).toEqual([])
  })
})

describe('App navigation', () => {
  it('picking a team opens its remembered variant, else the first', async () => {
    stubOverlay([alpha, beta, delta])
    await mountApp()
    await pick('Beta')
    await userEvent.click(variantTab('Practice'))
    await clickBack()
    await pick('Delta')
    expect(variantTab('Standard')).toHaveAttribute('aria-pressed', 'true')
    expect(unitNames()).toEqual(['🌀 D1'])
    await clickBack()
    await pick('Beta')
    expect(variantTab('Practice')).toHaveAttribute('aria-pressed', 'true')
    expect(unitNames()).toEqual(['🌀 B2'])
  })

  it('picking Genshin then a team shows the Genshin legend', async () => {
    stubOverlay([alpha, skirk])
    await mountApp()
    await pick(/Genshin Impact/)
    await pick('Skirk')
    expect(unitNames()).toEqual(['🌀 S1'])
    expect(screen.getByText('Burst')).toBeInTheDocument()
    expect(screen.queryByText('Lib')).not.toBeInTheDocument()
  })

  // the games step is skipped with one game, so there is nothing to go back to
  it('one game: opens on its teams, with no back', async () => {
    stubOverlay([alpha, beta])
    await mountApp()
    expect(wuwaTeams()).toBeInTheDocument()
    expect(screen.queryByTitle('back to the picker')).not.toBeInTheDocument()
  })

  it("goes back to the game's teams, and from there to the games", async () => {
    store('lastTeam', 'wuwa/beta')
    stubOverlay([alpha, beta, skirk])
    await mountApp()
    await clickBack()
    expect(wuwaTeams()).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument()
    await clickBack()
    expect(gameButtons()).toHaveLength(2)
  })
})

describe('App pushes', () => {
  it('shows the teams when a push removes the open team', async () => {
    const { push } = stubOverlay([alpha, beta])
    await mountApp()
    await pick('Beta')
    push([alpha, gamma])
    expect(wuwaTeams()).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gamma' })).toBeInTheDocument()
    expect(unitNames()).toEqual([])
  })

  // the fall back is never stored, so one bad save does not lose the pick
  it('returns to the open team when a later push brings it back', async () => {
    const { push } = stubOverlay([alpha, beta])
    await mountApp()
    await pick('Beta')
    push([alpha, gamma])
    push([alpha, beta, gamma])
    expect(unitNames()).toEqual(['🌀 B1'])
  })

  // gamma moves in front and practice moves down a slot, so a pick held by position drifts;
  // standard stays first, so a reset to the first variant shows too
  it('keeps the team and variant when a push keeps them', async () => {
    const { push } = stubOverlay([alpha, beta])
    await mountApp()
    await pick('Beta')
    await userEvent.click(variantTab('Practice'))
    const gammaFirst = rotation('wuwa', 'gamma', {
      label: 'Gamma',
      order: 0,
      variants: [standard('G1')]
    })
    const betaEdited = rotation('wuwa', 'beta', {
      label: 'Beta v2',
      order: 2,
      variants: [standard('B1'), variant('extra', 'Extra', 'BX'), practice]
    })
    push([gammaFirst, alpha, betaEdited])
    expect(variantTab('Extra')).toBeInTheDocument() // the edited file is the one shown
    expect(variantTab('Practice')).toHaveAttribute('aria-pressed', 'true')
    expect(unitNames()).toEqual(['🌀 B2'])
  })
})

describe('App keys', () => {
  it('stores the keys toggle as showKeys', async () => {
    store('lastTeam', 'wuwa/alpha')
    stubOverlay([alpha])
    await mountApp()
    expect(screen.queryByText('E')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: 'keys' }))
    expect(screen.getByText('E')).toBeInTheDocument()
    expect(localStorage.getItem('showKeys')).toBe('true')
  })

  // truthy, so it would show the keys if it were taken as the boolean it is not
  it('hides the keys when the stored showKeys is not a boolean', async () => {
    store('lastTeam', 'wuwa/alpha')
    store('showKeys', 'yes')
    stubOverlay([alpha])
    await mountApp()
    expect(screen.getByRole('checkbox', { name: 'keys' })).not.toBeChecked()
    expect(screen.queryByText('E')).not.toBeInTheDocument()
  })
})

describe('App rotation screen', () => {
  it('shows no row of the other teams', async () => {
    store('lastTeam', 'wuwa/alpha')
    stubOverlay([alpha, beta, gamma])
    await mountApp()
    expect(unitNames()).toEqual(['🌀 A1'])
    expect(screen.queryByRole('button', { name: 'Beta' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Gamma' })).not.toBeInTheDocument()
  })

  it("lists no other file's error", async () => {
    store('lastTeam', 'wuwa/alpha')
    stubOverlay([alpha, broken('wuwa/broken.json')])
    await mountApp()
    expect(unitNames()).toEqual(['🌀 A1'])
    expect(screen.queryByText('wuwa/broken.json')).not.toBeInTheDocument()
  })

  it("counts a bad file on the back control and lists it in its game's teams", async () => {
    store('lastTeam', 'wuwa/alpha')
    stubOverlay([alpha, broken('wuwa/broken.json'), skirk])
    await mountApp()
    expect(back()).toHaveTextContent('⚠ 1')
    await clickBack()
    expect(wuwaTeams()).toBeInTheDocument()
    expect(screen.getByText('wuwa/broken.json')).toBeInTheDocument()
  })
})

describe('App modes', () => {
  it('in a browser: no app bar, back first in the top row, and a pop-out', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    store('lastTeam', bundledTeam)
    await mountApp()
    expect(unitNames().length).toBeGreaterThan(0)
    expect(appBar()).not.toBeInTheDocument()
    expect(popOut()?.parentElement?.firstElementChild).toBe(back())
    expect(popOut()).toHaveTextContent('⧉ pop out')
    await userEvent.click(popOut()!)
    expect(open).toHaveBeenCalledExactlyOnceWith(
      location.href,
      'toa-rot',
      'popup,width=300,height=760'
    )
  })

  it('in a browser: the picker has the pop-out above the list', async () => {
    await mountApp()
    const [firstGame] = gameButtons()
    expect(firstGame).toBeDefined()
    expect(popOut()!.compareDocumentPosition(firstGame!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('in the app: back in the app bar and only there, and no pop-out', async () => {
    store('lastTeam', 'wuwa/alpha')
    stubOverlay([alpha])
    await mountApp()
    expect(screen.getAllByTitle('back to the picker')).toHaveLength(1)
    expect(appBar()?.parentElement).toContainElement(back())
    expect(popOut()).not.toBeInTheDocument()
  })

  it('in the app: no pop-out on the games or the teams screen either', async () => {
    stubOverlay([alpha, skirk])
    await mountApp()
    expect(gameButtons()).toHaveLength(2)
    expect(popOut()).not.toBeInTheDocument()
    await pick(/Wuthering Waves/)
    expect(wuwaTeams()).toBeInTheDocument()
    expect(popOut()).not.toBeInTheDocument()
  })
})

describe('App collapse', () => {
  const bar = () => screen.getByTitle('expand').parentElement!
  const collapse = () => userEvent.click(screen.getByTitle('collapse to a bar'))

  it('hides the page and sends the body height, rounded up', async () => {
    store('lastTeam', 'wuwa/alpha')
    const { overlay } = stubOverlay([alpha, beta])
    await mountApp()
    vi.spyOn(document.body, 'getBoundingClientRect').mockReturnValue({ height: 33.2 } as DOMRect)
    await collapse()
    expect(overlay.collapse).toHaveBeenCalledExactlyOnceWith(34)
    expect(screen.getByRole('heading', { name: '🌀 A1', hidden: true })).not.toBeVisible()
  })

  // the page's body background keys off this class
  it('marks its root collapsed while collapsed, and only then', async () => {
    store('lastTeam', 'wuwa/alpha')
    stubOverlay([alpha])
    const container = await mountApp()
    const rootClass = () => container.firstElementChild?.className
    expect(rootClass()).not.toContain('collapsed')
    await collapse()
    expect(rootClass()).toContain('collapsed')
    await userEvent.click(screen.getByTitle('expand'))
    expect(rootClass()).not.toContain('collapsed')
  })

  it('keeps the marked card through a collapse and an expand', async () => {
    const duo = rotation('wuwa', 'duo', {
      label: 'Duo',
      order: 0,
      variants: [{ id: 'standard', label: 'Standard', units: [unit('D1'), unit('D2')] }]
    })
    store('lastTeam', 'wuwa/duo')
    stubOverlay([duo])
    await mountApp()
    const marked = () =>
      Array.from(document.querySelectorAll('section')).map((s) => s.className.includes('marked'))
    await userEvent.click(screen.getByRole('heading', { name: '🌀 D2' }))
    expect(marked()).toEqual([false, true])
    await collapse()
    await userEvent.click(screen.getByTitle('expand'))
    expect(marked()).toEqual([false, true])
  })

  it('titles the bar with the team alone on its first variant', async () => {
    store('lastTeam', 'wuwa/alpha')
    stubOverlay([alpha, beta])
    await mountApp()
    await collapse()
    // exact match: 'Alpha · Standard' would not be found
    expect(within(bar()).getByText('Alpha')).toBeVisible()
  })

  it('titles the bar with team and variant on any other variant', async () => {
    stubOverlay([alpha, beta])
    await mountApp()
    await pick('Beta')
    await userEvent.click(variantTab('Practice'))
    await collapse()
    expect(within(bar()).getByText('Beta · Practice')).toBeVisible()
  })

  it('titles the bar with the file on a broken team', async () => {
    store('lastTeam', 'wuwa/beta')
    stubOverlay([alpha, broken('wuwa/beta.json')])
    await mountApp()
    await collapse()
    expect(within(bar()).getByText('wuwa/beta.json')).toBeVisible()
  })

  it('titles the bar pick a rotation on the picker', async () => {
    stubOverlay([alpha, beta])
    await mountApp()
    await collapse()
    expect(within(bar()).getByText('pick a rotation')).toBeVisible()
  })
})
