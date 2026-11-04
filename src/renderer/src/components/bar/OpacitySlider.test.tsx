import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetRootVars, rootVar } from '../../test/rootVars'
import { OpacitySlider } from './OpacitySlider'

function mount(over: Partial<Parameters<typeof OpacitySlider>[0]> = {}) {
  render(
    <OpacitySlider
      title="background opacity"
      cssVar="--a"
      storageKey="bgAlpha"
      fallback={0.4}
      {...over}
    />
  )
  return screen.getByRole('slider') as HTMLInputElement
}

beforeEach(() => localStorage.clear())
afterEach(resetRootVars)

describe('OpacitySlider', () => {
  it('is a 0 to 1 range in steps of .05', () => {
    const slider = mount()
    expect(slider).toHaveAttribute('type', 'range')
    expect(slider).toHaveAttribute('min', '0')
    expect(slider).toHaveAttribute('max', '1')
    expect(slider).toHaveAttribute('step', '0.05')
  })

  it('starts at the fallback and writes it to the root', () => {
    const slider = mount()
    expect(slider.value).toBe('0.4')
    expect(rootVar('--a')).toBe('0.4')
  })

  it('a stored value wins over the fallback', () => {
    localStorage.setItem('bgAlpha', '0.25')
    const slider = mount()
    expect(slider.value).toBe('0.25')
    expect(rootVar('--a')).toBe('0.25')
  })

  it('moving the slider sets the var on the root and persists it', () => {
    const slider = mount()
    fireEvent.change(slider, { target: { value: '0.7' } })
    expect(slider.value).toBe('0.7')
    expect(rootVar('--a')).toBe('0.7')
    expect(localStorage.getItem('bgAlpha')).toBe('0.7')
  })

  it('writes the var and key it was given, and no other', () => {
    const slider = mount({
      title: 'card opacity',
      cssVar: '--c',
      storageKey: 'cardAlpha',
      fallback: 0.6
    })
    expect(slider).toHaveAttribute('title', 'card opacity')
    fireEvent.change(slider, { target: { value: '0.85' } })
    expect(rootVar('--c')).toBe('0.85')
    expect(localStorage.getItem('cardAlpha')).toBe('0.85')
    expect(rootVar('--a')).toBe('')
    expect(localStorage.getItem('bgAlpha')).toBeNull()
  })

  // valid JSON that is not an alpha; written to the root it would blank the background
  it.each(['"abc"', '7', '-0.5', 'null', '[0.5]'])('stored junk %s gives the fallback', (junk) => {
    localStorage.setItem('bgAlpha', junk)
    const slider = mount()
    expect(slider.value).toBe('0.4')
    expect(rootVar('--a')).toBe('0.4')
  })
})
