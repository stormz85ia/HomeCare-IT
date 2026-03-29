import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TechSelector } from '../TechSelector'

describe('TechSelector', () => {
  it('renders all 3 technologies', () => {
    render(<TechSelector selected={null} onSelect={vi.fn()} />)
    expect(screen.getByText('Fibre OTO')).toBeInTheDocument()
    expect(screen.getByText('VDSL')).toBeInTheDocument()
    expect(screen.getByText('Câble')).toBeInTheDocument()
  })

  it('calls onSelect with correct value', () => {
    const onSelect = vi.fn()
    render(<TechSelector selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('VDSL'))
    expect(onSelect).toHaveBeenCalledWith('vdsl')
  })
})
