'use client'
import { useSessionStore } from '@/store/useSessionStore'
import { getChecklist } from '@/data/checklists'
import type { DiagnosticNode, Checklist } from '@/types'

interface DiagnosticEngineResult {
  checklist: Checklist | null
  currentNode: DiagnosticNode | null
  isResolved: boolean
  isEscalated: boolean
  navigate: (next: string) => void
  restart: () => void
}

export function useDiagnosticEngine(): DiagnosticEngineResult {
  const { fai, technology, currentNodeId, advanceNode } = useSessionStore()
  const checklist = fai && technology ? getChecklist(fai, technology) : null
  const effectiveNodeId = currentNodeId ?? checklist?.entry ?? null
  const currentNode =
    effectiveNodeId && effectiveNodeId !== 'RESOLVED' && effectiveNodeId !== 'ESCALATE' && checklist
      ? (checklist.nodes[effectiveNodeId] ?? null)
      : null
  return {
    checklist,
    currentNode,
    isResolved: effectiveNodeId === 'RESOLVED',
    isEscalated: effectiveNodeId === 'ESCALATE',
    navigate: (next) => advanceNode(next),
    restart: () => checklist && advanceNode(checklist.entry),
  }
}
