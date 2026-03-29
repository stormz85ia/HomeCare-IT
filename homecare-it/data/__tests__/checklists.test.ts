import { describe, it, expect } from 'vitest'
import { checklists, getChecklist } from '../checklists'

describe('checklists integrity', () => {
  it('getChecklist finds swisscom+vdsl', () => {
    const c = getChecklist('swisscom', 'vdsl')
    expect(c).not.toBeNull()
    expect(c?.entry).toBe('q1')
  })

  it('getChecklist returns fallback for unknown combo', () => {
    const c = getChecklist('salt', 'fibre_oto')
    expect(c).not.toBeNull() // fallback to 'autre'
  })

  it('every node referenced in options exists', () => {
    for (const c of checklists) {
      for (const node of Object.values(c.nodes)) {
        for (const opt of node.options) {
          if (opt.next !== 'RESOLVED' && opt.next !== 'ESCALATE') {
            expect(c.nodes[opt.next]).toBeDefined()
          }
        }
      }
    }
  })

  it('entry node exists in nodes', () => {
    for (const c of checklists) {
      expect(c.nodes[c.entry]).toBeDefined()
    }
  })
})
