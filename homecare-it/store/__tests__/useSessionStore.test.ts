import { describe, it, expect, beforeEach } from 'vitest'
import { useSessionStore } from '../useSessionStore'

beforeEach(() => {
  useSessionStore.getState().resetSession()
})

describe('useSessionStore', () => {
  it('initial state has no consent and no profile', () => {
    const s = useSessionStore.getState()
    expect(s.consentGiven).toBe(false)
    expect(s.technology).toBeNull()
    expect(s.fai).toBeNull()
    expect(s.phase).toBe('onboarding')
    expect(s.messages).toEqual([])
  })

  it('setConsent updates consentGiven', () => {
    useSessionStore.getState().setConsent(true)
    expect(useSessionStore.getState().consentGiven).toBe(true)
  })

  it('setProfile sets technology and fai', () => {
    useSessionStore.getState().setProfile('vdsl', 'swisscom')
    const s = useSessionStore.getState()
    expect(s.technology).toBe('vdsl')
    expect(s.fai).toBe('swisscom')
  })

  it('addMessage appends message', () => {
    useSessionStore.getState().addMessage({
      id: '1',
      role: 'bot',
      content: 'Bonjour',
      timestamp: 0,
    })
    expect(useSessionStore.getState().messages).toHaveLength(1)
  })

  it('resetSession clears all state', () => {
    useSessionStore.getState().setConsent(true)
    useSessionStore.getState().setProfile('vdsl', 'swisscom')
    useSessionStore.getState().resetSession()
    const s = useSessionStore.getState()
    expect(s.consentGiven).toBe(false)
    expect(s.technology).toBeNull()
    expect(s.messages).toEqual([])
  })

  it('buildNotifySummary returns paired Q&A', () => {
    useSessionStore.getState().addMessage({ id: '1', role: 'bot', content: 'Connexion coupée ?', timestamp: 0 })
    useSessionStore.getState().addMessage({ id: '2', role: 'user', content: 'Totalement', timestamp: 1 })
    const summary = useSessionStore.getState().buildNotifySummary()
    expect(summary).toContain('Connexion coupée')
    expect(summary).toContain('Totalement')
  })
})
