import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ConsentCheckbox } from '../ConsentCheckbox'

describe('ConsentCheckbox', () => {
  it('renders unchecked by default', () => {
    render(<ConsentCheckbox checked={false} onChange={vi.fn()} />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('calls onChange when clicked', () => {
    const onChange = vi.fn()
    render(<ConsentCheckbox checked={false} onChange={onChange} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('renders RGPD/LPD label text', () => {
    render(<ConsentCheckbox checked={false} onChange={vi.fn()} />)
    expect(screen.getByText(/traitement local/i)).toBeInTheDocument()
  })
})
