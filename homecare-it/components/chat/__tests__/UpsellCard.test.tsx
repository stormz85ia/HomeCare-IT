import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { UpsellCard } from '../UpsellCard'

describe('UpsellCard', () => {
  it('renders price and pack name', () => {
    render(<UpsellCard onActivate={vi.fn()} onSkip={vi.fn()} />)
    expect(screen.getByText('Pack Annuel Tranquillité')).toBeInTheDocument()
    expect(screen.getByText(/^89 CHF$/)).toBeInTheDocument()
  })
  it('calls onActivate when CTA clicked', () => {
    const onActivate = vi.fn()
    render(<UpsellCard onActivate={onActivate} onSkip={vi.fn()} />)
    fireEvent.click(screen.getByText(/Activer le Pack VIP/))
    expect(onActivate).toHaveBeenCalled()
  })
  it('calls onSkip when secondary CTA clicked', () => {
    const onSkip = vi.fn()
    render(<UpsellCard onActivate={vi.fn()} onSkip={onSkip} />)
    fireEvent.click(screen.getByText(/Réserver une intervention sans pack/i))
    expect(onSkip).toHaveBeenCalled()
  })
})
