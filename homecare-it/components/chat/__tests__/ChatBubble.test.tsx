import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChatBubble } from '../ChatBubble'

describe('ChatBubble', () => {
  it('renders bot bubble', () => {
    render(<ChatBubble role="bot" content="Bonjour !" />)
    expect(screen.getByText('Bonjour !')).toBeInTheDocument()
  })
  it('renders user bubble', () => {
    render(<ChatBubble role="user" content="Totalement coupée" />)
    expect(screen.getByText('Totalement coupée')).toBeInTheDocument()
  })
  it('bot bubble has justify-start', () => {
    const { container } = render(<ChatBubble role="bot" content="Test" />)
    expect(container.firstChild).toHaveClass('justify-start')
  })
  it('user bubble has justify-end', () => {
    const { container } = render(<ChatBubble role="user" content="Test" />)
    expect(container.firstChild).toHaveClass('justify-end')
  })
})
