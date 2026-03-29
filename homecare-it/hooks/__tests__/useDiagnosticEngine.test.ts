import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDiagnosticEngine } from '../useDiagnosticEngine'
import { useSessionStore } from '@/store/useSessionStore'

beforeEach(() => {
  useSessionStore.getState().resetSession()
  useSessionStore.getState().setProfile('vdsl', 'swisscom')
})

describe('useDiagnosticEngine', () => {
  it('loads checklist and returns entry node', () => {
    const { result } = renderHook(() => useDiagnosticEngine())
    expect(result.current.currentNode?.id).toBe('q1')
  })

  it('navigate() advances to next node', () => {
    const { result } = renderHook(() => useDiagnosticEngine())
    act(() => { result.current.navigate('q2') })
    expect(result.current.currentNode?.id).toBe('q2')
  })

  it('isResolved is true when RESOLVED', () => {
    const { result } = renderHook(() => useDiagnosticEngine())
    act(() => { result.current.navigate('RESOLVED') })
    expect(result.current.isResolved).toBe(true)
    expect(result.current.isEscalated).toBe(false)
  })

  it('isEscalated is true when ESCALATE', () => {
    const { result } = renderHook(() => useDiagnosticEngine())
    act(() => { result.current.navigate('ESCALATE') })
    expect(result.current.isEscalated).toBe(true)
  })

  it('returns null node when no profile set', () => {
    useSessionStore.getState().resetSession()
    const { result } = renderHook(() => useDiagnosticEngine())
    expect(result.current.currentNode).toBeNull()
  })
})
