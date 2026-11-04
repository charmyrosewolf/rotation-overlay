import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FileError } from './FileError'

describe('FileError', () => {
  it('names the file and shows the message', () => {
    render(
      <FileError
        problem={{ file: 'wuwa/bad.json', message: 'variants.0.units: Invalid input' }}
      />
    )
    expect(screen.getByText('wuwa/bad.json')).toBeInTheDocument()
    expect(screen.getByText('variants.0.units: Invalid input')).toBeInTheDocument()
  })

  it('shows markup in the message literally', () => {
    const { container } = render(
      <FileError problem={{ file: 'wuwa/x.json', message: 'JSON: <i>oops</i>' }} />
    )
    expect(container.querySelector('i')).toBeNull()
    expect(screen.getByText('JSON: <i>oops</i>')).toBeInTheDocument()
  })
})
