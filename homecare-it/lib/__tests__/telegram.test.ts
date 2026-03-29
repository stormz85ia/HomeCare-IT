import { describe, it, expect } from 'vitest'
import { buildNotifySummary } from '../telegram'
import type { ChatMessage } from '@/types'

describe('buildNotifySummary', () => {
  it('pairs bot questions with user answers', () => {
    const messages: ChatMessage[] = [
      { id: '1', role: 'bot', content: 'Connexion coupée ou lente ?', timestamp: 0 },
      { id: '2', role: 'user', content: 'Totalement coupée', timestamp: 1 },
      { id: '3', role: 'bot', content: 'Les voyants sont allumés ?', timestamp: 2 },
      { id: '4', role: 'user', content: 'Éteints', timestamp: 3 },
    ]
    const summary = buildNotifySummary(messages)
    expect(summary).toContain('Totalement coupée')
    expect(summary).toContain('Éteints')
    expect(summary).toContain('→')
  })

  it('returns fallback for empty messages', () => {
    expect(buildNotifySummary([])).toBe('Aucun détail disponible')
  })
})
