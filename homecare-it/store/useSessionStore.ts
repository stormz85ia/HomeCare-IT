// store/useSessionStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FAI, Technology, Phase, PaymentMethod, ChatMessage } from '@/types'
import { buildNotifySummary as buildSummary } from '@/lib/telegram'

interface SessionState {
  consentGiven: boolean
  technology: Technology | null
  fai: FAI | null
  messages: ChatMessage[]
  currentNodeId: string | null
  phase: Phase
  paymentMethod: PaymentMethod | null

  setConsent: (v: boolean) => void
  setProfile: (tech: Technology, fai: FAI) => void
  addMessage: (msg: ChatMessage) => void
  advanceNode: (nodeId: string) => void
  setPhase: (phase: Phase) => void
  setPaymentMethod: (method: PaymentMethod) => void
  resetSession: () => void
  buildNotifySummary: () => string
}

const initialState = {
  consentGiven: false,
  technology: null as Technology | null,
  fai: null as FAI | null,
  messages: [] as ChatMessage[],
  currentNodeId: null as string | null,
  phase: 'onboarding' as Phase,
  paymentMethod: null as PaymentMethod | null,
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setConsent: (v) => set({ consentGiven: v }),
      setProfile: (technology, fai) => set({ technology, fai }),
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      advanceNode: (nodeId) => set({ currentNodeId: nodeId }),
      setPhase: (phase) => set({ phase }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      resetSession: () => set({ ...initialState }),
      buildNotifySummary: () => buildSummary(get().messages),
    }),
    {
      name: 'homecare-session',
      storage: {
        getItem: (key: string) => {
          try {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) : null
          } catch {
            return null
          }
        },
        setItem: (key: string, value: unknown) => {
          try {
            localStorage.setItem(key, JSON.stringify(value))
          } catch {
            // Ignore storage errors (e.g., SSR or restricted environments)
          }
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(key)
          } catch {
            // Ignore storage errors
          }
        },
      },
      partialize: (state) => ({
        consentGiven: state.consentGiven,
        technology: state.technology,
        fai: state.fai,
      }),
    }
  )
)
