import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { FileProblem, GameGroup, Team } from '../../data/loadRotations'
import { BackButton, GameList, TeamList } from './Picker'

const team = (game: string, slug: string, label: string): Team => ({
  id: `${game}/${slug}`,
  game,
  label,
  variants: [{ id: 'standard', label: 'Standard', units: [] }]
})
const problem = (file: string, message = 'variants: Invalid input'): FileProblem => ({
  file,
  message
})
const group = (
  id: string,
  name: string,
  teams: Team[] = [],
  errors: FileProblem[] = []
): GameGroup => ({ id, name, teams, errors })

const genshin = group(
  'genshin',
  'Genshin Impact',
  [team('genshin', 'a', 'A'), team('genshin', 'b', 'B'), team('genshin', 'c', 'C')],
  [problem('genshin/x.json'), problem('genshin/y.json')]
)
const wuwa = group('wuwa', 'Wuthering Waves', [team('wuwa', 'mornye', 'Mornye')])
const stray = [problem('hsr/x.json', 'unknown folder'), problem('loose.json', 'no folder')]

const noop = () => {}

describe('GameList', () => {
  it('renders one button per game in the order given, showing its name', () => {
    render(<GameList games={[genshin, wuwa]} other={[]} onPick={noop} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0]).toHaveTextContent('Genshin Impact')
    expect(buttons[1]).toHaveTextContent('Wuthering Waves')
  })

  it('calls onPick with the id of the clicked game', async () => {
    const onPick = vi.fn()
    render(<GameList games={[genshin, wuwa]} other={[]} onPick={onPick} />)
    await userEvent.click(screen.getByRole('button', { name: /Wuthering Waves/ }))
    expect(onPick).toHaveBeenCalledExactlyOnceWith('wuwa')
  })

  it('shows each game its team count, singular for one', () => {
    render(<GameList games={[genshin, wuwa]} other={[]} onPick={noop} />)
    const [first, second] = screen.getAllByRole('button')
    expect(within(first!).getByText('3 teams')).toBeInTheDocument()
    expect(within(second!).getByText('1 team')).toBeInTheDocument()
  })

  it('shows a warning badge with the error count on a game that has errors', () => {
    render(<GameList games={[genshin, wuwa]} other={[]} onPick={noop} />)
    expect(within(screen.getAllByRole('button')[0]!).getByText('⚠ 2')).toBeInTheDocument()
  })

  it('shows no badge on a game without errors', () => {
    render(<GameList games={[genshin, wuwa]} other={[]} onPick={noop} />)
    expect(within(screen.getAllByRole('button')[1]!).queryByText(/⚠/)).not.toBeInTheDocument()
  })

  it('lists a game whose files all fail, with no teams', () => {
    const broken = group('genshin', 'Genshin Impact', [], [problem('genshin/x.json')])
    render(<GameList games={[broken]} other={[]} onPick={noop} />)
    const button = screen.getByRole('button')
    expect(within(button).getByText('0 teams')).toBeInTheDocument()
    expect(within(button).getByText('⚠ 1')).toBeInTheDocument()
  })

  it('shows an Other heading and a card per problem when other is not empty', () => {
    render(<GameList games={[wuwa]} other={stray} onPick={noop} />)
    expect(screen.getByRole('heading', { name: 'Other' })).toBeInTheDocument()
    expect(screen.getByText('hsr/x.json')).toBeInTheDocument()
    expect(screen.getByText('unknown folder')).toBeInTheDocument()
    expect(screen.getByText('loose.json')).toBeInTheDocument()
    expect(screen.getByText('no folder')).toBeInTheDocument()
  })

  it('has no Other heading when other is empty', () => {
    render(<GameList games={[genshin, wuwa]} other={[]} onPick={noop} />)
    expect(screen.queryByRole('heading', { name: 'Other' })).not.toBeInTheDocument()
  })

  it('says nothing was found when there are no games and no problems', () => {
    render(<GameList games={[]} other={[]} onPick={noop} />)
    expect(screen.getByText('No rotations found in rotations/')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('does not say nothing was found when there are games', () => {
    render(<GameList games={[wuwa]} other={[]} onPick={noop} />)
    expect(screen.queryByText(/No rotations found/)).not.toBeInTheDocument()
  })

  it('does not say nothing was found when only other has problems', () => {
    render(<GameList games={[]} other={stray} onPick={noop} />)
    expect(screen.queryByText(/No rotations found/)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Other' })).toBeInTheDocument()
  })
})

describe('TeamList', () => {
  // the longest real label (24 chars) in the first slot
  const long = '🌀 Mizuki · Stellar Swirl'
  const mixed = group(
    'genshin',
    'Genshin Impact',
    [team('genshin', 'b', long), team('genshin', 'a', 'Alpha team')],
    [problem('genshin/x.json', 'JSON: bad'), problem('genshin/y.json', 'steps: bad')]
  )

  it('heads the list with the game name', () => {
    render(<TeamList group={mixed} onPick={noop} />)
    expect(screen.getByRole('heading', { name: 'Genshin Impact' })).toBeInTheDocument()
  })

  it('renders one button per team, by label, in the order given', () => {
    render(<TeamList group={mixed} onPick={noop} />)
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      '🌀 Mizuki · Stellar Swirl',
      'Alpha team'
    ])
  })

  it('renders a real-sized team label in full', () => {
    expect([...long]).toHaveLength(24)
    render(<TeamList group={mixed} onPick={noop} />)
    expect(screen.getByRole('button', { name: long })).toHaveTextContent(long)
  })

  it('calls onPick with the id of the clicked team', async () => {
    const onPick = vi.fn()
    render(<TeamList group={mixed} onPick={onPick} />)
    await userEvent.click(screen.getByRole('button', { name: 'Alpha team' }))
    expect(onPick).toHaveBeenCalledExactlyOnceWith('genshin/a')
  })

  it('shows a FileError for each of the game errors, naming the file', () => {
    render(<TeamList group={mixed} onPick={noop} />)
    expect(screen.getByText('genshin/x.json')).toBeInTheDocument()
    expect(screen.getByText('JSON: bad')).toBeInTheDocument()
    expect(screen.getByText('genshin/y.json')).toBeInTheDocument()
    expect(screen.getByText('steps: bad')).toBeInTheDocument()
  })

  it('has no back button without onBack', () => {
    render(<TeamList group={mixed} onPick={noop} />)
    expect(screen.queryByTitle('back to the picker')).not.toBeInTheDocument()
  })

  it('has a back button before the heading when onBack is given, and clicking calls it', async () => {
    const onBack = vi.fn()
    render(<TeamList group={mixed} onPick={noop} onBack={onBack} />)
    const back = screen.getByTitle('back to the picker')
    const heading = screen.getByRole('heading', { name: 'Genshin Impact' })
    expect(back.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await userEvent.click(back)
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('keeps the errors out of the back button, since they are listed right below', () => {
    render(<TeamList group={mixed} onPick={noop} onBack={noop} />)
    expect(within(screen.getByTitle('back to the picker')).queryByText(/⚠/)).not.toBeInTheDocument()
  })
})

describe('BackButton', () => {
  it('is a button titled back to the picker, showing a chevron', () => {
    render(<BackButton errorCount={0} onClick={noop} />)
    const button = screen.getByTitle('back to the picker')
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveTextContent('‹')
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<BackButton errorCount={0} onClick={onClick} />)
    await userEvent.click(screen.getByTitle('back to the picker'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('shows the error count in a badge inside the button', () => {
    render(<BackButton errorCount={3} onClick={noop} />)
    expect(within(screen.getByTitle('back to the picker')).getByText('⚠ 3')).toBeInTheDocument()
  })

  it('shows no badge at zero errors', () => {
    render(<BackButton errorCount={0} onClick={noop} />)
    expect(screen.getByTitle('back to the picker')).not.toHaveTextContent('⚠')
  })
})
