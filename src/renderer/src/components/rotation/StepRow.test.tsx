import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Step } from '../../data/schema'
import { block } from './Note.css'
import { StepRow } from './StepRow'

const step: Step = [
  { type: 'skill', label: 'Skill', key: 'E' },
  { note: 'then' },
  { type: 'basic', label: 'Basic' }
]

describe('StepRow', () => {
  it('leads with the number from n, then chips and notes in step order', () => {
    const { container } = render(<StepRow step={step} n={3} showKeys={false} />)
    const parts = Array.from(container.firstElementChild!.children).map((c) => c.textContent)
    expect(parts).toEqual(['3', 'Skill', 'then', 'Basic'])
  })

  it('draws an inline note, not a block one', () => {
    render(<StepRow step={step} n={1} showKeys={false} />)
    expect(screen.getByText('then')).not.toHaveClass(block)
  })
})
