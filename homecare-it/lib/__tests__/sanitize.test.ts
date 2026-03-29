import { describe, it, expect } from 'vitest'
import { sanitize } from '../sanitize'

describe('sanitize', () => {
  it('strips script tags', () => {
    expect(sanitize('<script>alert(1)</script>Hello')).toBe('Hello')
  })

  it('strips onerror attributes', () => {
    expect(sanitize('<img src=x onerror=alert(1)>')).not.toContain('onerror')
  })

  it('preserves plain text', () => {
    expect(sanitize('Votre connexion est coupée ?')).toBe('Votre connexion est coupée ?')
  })
})
