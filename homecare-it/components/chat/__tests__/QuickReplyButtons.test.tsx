import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QuickReplyButtons } from '../QuickReplyButtons'
import type { DiagnosticOption } from '@/types'

const options: DiagnosticOption[] = [
  { label: 'Oui', next: 'q2' },
  { label: 'Non', next: 'ESCALATE' },
]

describe('QuickReplyButtons', () => {
  it('renders all options', () => {
    render(<QuickReplyButtons options={options} onSelect={vi.fn()} />)
    expect(screen.getByText('Oui')).toBeInTheDocument()
    expect(screen.getByText('Non')).toBeInTheDocument()
  })
  it('calls onSelect with option on click', () => {
    const onSelect = vi.fn()
    render(<QuickReplyButtons options={options} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Oui'))
    expect(onSelect).toHaveBeenCalledWith(options[0])
  })
  it('disables buttons when disabled prop is true', () => {
    render(<QuickReplyButtons options={options} onSelect={vi.fn()} disabled />)
    screen.getAllByRole('button').forEach((btn) => expect(btn).toBeDisabled())
  })
})
