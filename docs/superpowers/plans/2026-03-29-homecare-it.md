# HomeCare IT — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Telegram Mini App + standalone PWA that guides users through an N1 internet diagnostic, upsells a premium pack, and notifies the technician via Telegram Bot API.

**Architecture:** Next.js 15 App Router with two client routes (`/onboarding`, `/chat`) and one Edge API route (`/api/notify`). All diagnostic logic is driven by a static `checklists.ts` decision tree; state is held in Zustand with partial localStorage persistence. No database.

**Tech Stack:** Next.js 15, Tailwind CSS v4, shadcn/ui, Zustand, Zod, DOMPurify, @ducanh2912/next-pwa, Vitest, @testing-library/react, Vercel Edge runtime.

---

## File Map

| File | Responsibility |
|------|---------------|
| `types/index.ts` | All shared TypeScript types |
| `data/checklists.ts` | N1 decision trees by FAI+technology |
| `lib/sanitize.ts` | DOMPurify XSS sanitizer (browser-only) |
| `lib/telegram.ts` | SSR-safe window.Telegram.WebApp wrappers + buildNotifySummary |
| `store/useSessionStore.ts` | Zustand store + partial localStorage persist |
| `hooks/useDiagnosticEngine.ts` | Checklist lookup + tree navigation |
| `hooks/useTelegramContext.ts` | TMA vs standalone detection + WebApp side-effects |
| `components/onboarding/ConsentCheckbox.tsx` | RGPD/LPD consent checkbox |
| `components/onboarding/TechSelector.tsx` | Fibre OTO / VDSL / Câble toggle |
| `components/onboarding/FaiSelector.tsx` | FAI selection grid |
| `app/onboarding/page.tsx` | Phase 1 — full onboarding screen |
| `components/chat/ChatBubble.tsx` | Bot (left) / user (right) message bubble |
| `components/chat/QuickReplyButtons.tsx` | shadcn/ui Button group for fast replies |
| `components/chat/TypingIndicator.tsx` | Three-dot animation while bot "types" |
| `components/chat/UpsellCard.tsx` | "Pack Annuel Tranquillité" premium card |
| `components/payment/TwintQR.tsx` | TWINT QR placeholder screen |
| `components/payment/PayOnSite.tsx` | "Statut VIP pré-activé" confirmation screen |
| `app/chat/page.tsx` | Phase 2→3→4 — full chat screen |
| `app/api/notify/route.ts` | Edge API — Telegram Bot notification |
| `app/layout.tsx` | Root layout — TMA init, PWA meta, dark theme |
| `app/page.tsx` | Entry redirect → /onboarding or /chat |
| `next.config.ts` | CSP headers + @ducanh2912/next-pwa config |
| `public/manifest.json` | PWA manifest |
| `public/icons/` | PWA icons (192×192, 512×512) |

---

## Task 1: Project Scaffolding

**Files:**
- Create: `homecare-it/` (new Next.js project)
- Create: `.env.local`
- Create: `.gitignore` additions

- [ ] **Step 1.1: Scaffold Next.js 15 app**

```bash
cd "/Users/stormzmac/CLAUDE PROJECT/HomeCare IT"
npx create-next-app@latest homecare-it \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --no-eslint
```

When prompted, accept all defaults. Expected: project created in `homecare-it/`.

- [ ] **Step 1.2: Install dependencies**

```bash
cd homecare-it
npm install --silent zustand zod dompurify @ducanh2912/next-pwa
npm install --silent --save-dev @types/dompurify vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected: no errors, `node_modules/` updated.

- [ ] **Step 1.3: Install shadcn/ui**

```bash
npx shadcn@latest init --defaults
```

When prompted: style = Default, base color = Neutral, CSS variables = yes.

Then install required components:

```bash
npx shadcn@latest add button card checkbox badge scroll-area separator --silent
```

Expected: `components/ui/` directory populated.

- [ ] **Step 1.4: Create `.env.local`**

```bash
cat > .env.local << 'EOF'
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
```

- [ ] **Step 1.5: Add `.superpowers` to `.gitignore`**

Open `.gitignore` and append:

```
# Brainstorming artifacts
.superpowers/
```

- [ ] **Step 1.6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 + shadcn/ui + deps"
```

---

## Task 2: Vitest Setup

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 2.1: Create `vitest.config.ts`**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 2.2: Create `vitest.setup.ts`**

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 2.3: Add test script to `package.json`**

Open `package.json` and add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2.4: Verify Vitest works**

```bash
npm test
```

Expected: `No test files found` (0 tests, no errors).

- [ ] **Step 2.5: Commit**

```bash
git add vitest.config.ts vitest.setup.ts package.json
git commit -m "chore: add Vitest + testing-library setup"
```

---

## Task 3: Types

**Files:**
- Create: `types/index.ts`

- [ ] **Step 3.1: Write `types/index.ts`**

```typescript
// types/index.ts

export type FAI = 'swisscom' | 'salt' | 'sunrise' | 'netplus' | 'autre'
export type Technology = 'fibre_oto' | 'vdsl' | 'cable'
export type Phase = 'onboarding' | 'diagnostic' | 'upsell' | 'payment'
export type PaymentMethod = 'twint' | 'on_site' | 'on_site_no_pack'

/** 'RESOLVED' | 'ESCALATE' | '<node_id>' */
export type NodeResult = string

export interface DiagnosticOption {
  /** Text displayed in the quick reply button */
  label: string
  /** Next node id, or 'RESOLVED' / 'ESCALATE' */
  next: NodeResult
}

export interface DiagnosticNode {
  id: string
  /** Bot question displayed in a chat bubble */
  question: string
  options: DiagnosticOption[]
}

export interface Checklist {
  fai: FAI
  technology: Technology
  /** ID of the entry node */
  entry: string
  nodes: Record<string, DiagnosticNode>
}

export interface ChatMessage {
  id: string
  role: 'bot' | 'user'
  content: string
  timestamp: number
}

export interface NotifyPayload {
  technology: Technology
  fai: FAI
  /** Human-readable Q→A pairs joined by ' | ' */
  summary: string
  paymentMethod: PaymentMethod
}
```

- [ ] **Step 3.2: Commit**

```bash
git add types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 4: Data — `checklists.ts`

**Files:**
- Create: `data/checklists.ts`
- Create: `data/__tests__/checklists.test.ts`

- [ ] **Step 4.1: Write the failing test**

```typescript
// data/__tests__/checklists.test.ts
import { describe, it, expect } from 'vitest'
import { checklists, getChecklist } from '../checklists'

describe('checklists integrity', () => {
  it('getChecklist finds swisscom+vdsl', () => {
    const c = getChecklist('swisscom', 'vdsl')
    expect(c).not.toBeNull()
    expect(c?.entry).toBe('q1')
  })

  it('getChecklist returns null for unknown combo', () => {
    expect(getChecklist('salt', 'fibre_oto')).toBeNull()
  })

  it('every node referenced in options exists', () => {
    for (const c of checklists) {
      for (const node of Object.values(c.nodes)) {
        for (const opt of node.options) {
          if (opt.next !== 'RESOLVED' && opt.next !== 'ESCALATE') {
            expect(c.nodes[opt.next]).toBeDefined(
              `node "${opt.next}" referenced in "${node.id}" does not exist`
            )
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
```

- [ ] **Step 4.2: Run test — expect FAIL**

```bash
npm test -- data/__tests__/checklists.test.ts
```

Expected: FAIL with `Cannot find module '../checklists'`.

- [ ] **Step 4.3: Create `data/checklists.ts`**

```typescript
// data/checklists.ts
import type { Checklist, FAI, Technology } from '@/types'

export const checklists: Checklist[] = [
  {
    fai: 'swisscom',
    technology: 'vdsl',
    entry: 'q1',
    nodes: {
      q1: {
        id: 'q1',
        question: 'Votre connexion est-elle totalement coupée ou simplement lente ?',
        options: [
          { label: 'Totalement coupée', next: 'q2' },
          { label: 'Simplement lente', next: 'q_slow' },
        ],
      },
      q2: {
        id: 'q2',
        question: 'Les voyants de votre box Swisscom sont-ils allumés ?',
        options: [
          { label: '✅ Oui, tous allumés', next: 'q3' },
          { label: '⚠️ Partiellement allumés', next: 'q_partial' },
          { label: '❌ Éteints ou rouges', next: 'q_reboot' },
        ],
      },
      q3: {
        id: 'q3',
        question: 'Vos appareils sont-ils bien connectés au réseau Wi-Fi ou par câble ?',
        options: [
          { label: 'Oui, connectés', next: 'q_cable_check' },
          { label: 'Je ne sais pas', next: 'q_cable_check' },
        ],
      },
      q_cable_check: {
        id: 'q_cable_check',
        question: 'Essayez de brancher votre ordinateur directement à la box par câble Ethernet. La connexion fonctionne-t-elle ?',
        options: [
          { label: 'Oui, ça marche en câble', next: 'RESOLVED' },
          { label: 'Non, toujours pas', next: 'ESCALATE' },
        ],
      },
      q_partial: {
        id: 'q_partial',
        question: 'Le voyant "Internet" (globe ou @) est-il éteint ou rouge ?',
        options: [
          { label: 'Oui, éteint ou rouge', next: 'q_reboot' },
          { label: 'Il est allumé', next: 'q3' },
        ],
      },
      q_reboot: {
        id: 'q_reboot',
        question: 'Débranchez votre box 30 secondes, puis rebranchez-la. Attendez 2 minutes. La connexion est-elle rétablie ?',
        options: [
          { label: '✅ Oui, connexion rétablie', next: 'RESOLVED' },
          { label: '❌ Non, toujours éteints', next: 'q_line_check' },
        ],
      },
      q_line_check: {
        id: 'q_line_check',
        question: 'Y a-t-il des travaux dans votre quartier ou une panne signalée sur myswisscom.ch ?',
        options: [
          { label: 'Oui, panne signalée', next: 'RESOLVED' },
          { label: 'Non, rien de signalé', next: 'ESCALATE' },
        ],
      },
      q_slow: {
        id: 'q_slow',
        question: 'Votre connexion est-elle lente sur tous vos appareils ou seulement sur un ?',
        options: [
          { label: 'Sur tous les appareils', next: 'q_slow_all' },
          { label: 'Sur un seul appareil', next: 'RESOLVED' },
        ],
      },
      q_slow_all: {
        id: 'q_slow_all',
        question: 'Redémarrez votre box (débranchez 30s). La vitesse s\'améliore-t-elle ?',
        options: [
          { label: 'Oui, c\'est mieux', next: 'RESOLVED' },
          { label: 'Non, toujours lent', next: 'ESCALATE' },
        ],
      },
    },
  },
  // Fallback générique pour les autres combinaisons FAI/technologie
  {
    fai: 'autre',
    technology: 'vdsl',
    entry: 'q1',
    nodes: {
      q1: {
        id: 'q1',
        question: 'Votre connexion est-elle totalement coupée ou simplement lente ?',
        options: [
          { label: 'Totalement coupée', next: 'q_reboot' },
          { label: 'Simplement lente', next: 'q_slow' },
        ],
      },
      q_reboot: {
        id: 'q_reboot',
        question: 'Débranchez votre box 30 secondes, puis rebranchez-la. La connexion revient-elle ?',
        options: [
          { label: 'Oui, connexion rétablie', next: 'RESOLVED' },
          { label: 'Non, toujours hors ligne', next: 'ESCALATE' },
        ],
      },
      q_slow: {
        id: 'q_slow',
        question: 'Le problème de lenteur concerne-t-il tous vos appareils ?',
        options: [
          { label: 'Oui, tous', next: 'q_reboot' },
          { label: 'Non, un seul', next: 'RESOLVED' },
        ],
      },
    },
  },
]

/**
 * Returns the matching Checklist or a fallback 'autre' tree.
 * Returns null only if no checklist exists at all for the technology.
 */
export function getChecklist(fai: FAI, technology: Technology): Checklist | null {
  const exact = checklists.find((c) => c.fai === fai && c.technology === technology)
  if (exact) return exact

  // Fallback: same technology, 'autre' FAI
  const fallback = checklists.find((c) => c.fai === 'autre' && c.technology === technology)
  if (fallback) return fallback

  // Last resort: any 'autre' checklist
  return checklists.find((c) => c.fai === 'autre') ?? null
}
```

- [ ] **Step 4.4: Run tests — expect PASS**

```bash
npm test -- data/__tests__/checklists.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 4.5: Commit**

```bash
git add data/
git commit -m "feat: add N1 diagnostic checklists (Swisscom VDSL + autre fallback)"
```

---

## Task 5: `lib/sanitize.ts` + `lib/telegram.ts`

**Files:**
- Create: `lib/sanitize.ts`
- Create: `lib/telegram.ts`
- Create: `lib/__tests__/sanitize.test.ts`
- Create: `lib/__tests__/telegram.test.ts`

- [ ] **Step 5.1: Write failing tests**

```typescript
// lib/__tests__/sanitize.test.ts
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
```

```typescript
// lib/__tests__/telegram.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('telegram SSR safety', () => {
  it('isTMA returns false when window is undefined (SSR)', async () => {
    // Simulate SSR by deleting window
    const originalWindow = global.window
    // @ts-expect-error simulating SSR
    delete global.window
    const { isTMA } = await import('../telegram')
    expect(isTMA()).toBe(false)
    global.window = originalWindow
  })
})
```

- [ ] **Step 5.2: Run — expect FAIL**

```bash
npm test -- lib/__tests__/
```

Expected: FAIL with module not found.

- [ ] **Step 5.3: Create `lib/sanitize.ts`**

```typescript
// lib/sanitize.ts
// DOMPurify is browser-only; this function is safe to call on the client.
// Never call during SSR (it will no-op gracefully via the check below).
import type DOMPurifyType from 'dompurify'

let _purify: typeof DOMPurifyType | null = null

async function getPurify(): Promise<typeof DOMPurifyType> {
  if (!_purify) {
    const DOMPurify = (await import('dompurify')).default
    _purify = DOMPurify
  }
  return _purify
}

/**
 * Synchronous sanitize for text-only content.
 * Safe during SSR (returns input unchanged on server).
 */
export function sanitize(dirty: string): string {
  if (typeof window === 'undefined') return dirty
  // Lazy-load DOMPurify synchronously via a pre-initialized instance
  if (!_purify) {
    // Will be initialized on first async call; for sync use, strip tags manually
    return dirty.replace(/<[^>]*>/g, '')
  }
  return _purify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

/**
 * Initialize DOMPurify eagerly on the client. Call once in layout.tsx.
 */
export async function initSanitizer(): Promise<void> {
  if (typeof window !== 'undefined') {
    await getPurify()
  }
}
```

- [ ] **Step 5.4: Create `lib/telegram.ts`**

```typescript
// lib/telegram.ts
import type { ChatMessage } from '@/types'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        expand: () => void
        setHeaderColor: (color: string) => void
        MainButton: {
          text: string
          show: () => void
          hide: () => void
          onClick: (fn: () => void) => void
        }
      }
    }
  }
}

/** Returns true only in a real Telegram Mini App context (client-side). */
export function isTMA(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.Telegram !== 'undefined' &&
    !!window.Telegram.WebApp?.initData
  )
}

/** Expand the TMA to fullscreen. No-op outside TMA. */
export function expandTMA(): void {
  if (isTMA()) window.Telegram!.WebApp.expand()
}

/** Set TMA header background color. No-op outside TMA. */
export function setTMAHeaderColor(color: string): void {
  if (isTMA()) window.Telegram!.WebApp.setHeaderColor(color)
}

/**
 * Build a human-readable summary from chat messages for the /api/notify payload.
 * Pairs each bot question with the following user answer.
 */
export function buildNotifySummary(messages: ChatMessage[]): string {
  const pairs: string[] = []
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === 'bot' && messages[i + 1].role === 'user') {
      const question = messages[i].content.slice(0, 50).replace(/\n/g, ' ')
      const answer = messages[i + 1].content
      pairs.push(`${question} → ${answer}`)
    }
  }
  return pairs.join(' | ') || 'Aucun détail disponible'
}
```

- [ ] **Step 5.5: Run tests — expect PASS**

```bash
npm test -- lib/__tests__/
```

Expected: sanitize tests PASS. Telegram SSR test PASS.

- [ ] **Step 5.6: Commit**

```bash
git add lib/
git commit -m "feat: add sanitize + telegram utils"
```

---

## Task 6: Zustand Session Store

**Files:**
- Create: `store/useSessionStore.ts`
- Create: `store/__tests__/useSessionStore.test.ts`

- [ ] **Step 6.1: Write failing tests**

```typescript
// store/__tests__/useSessionStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useSessionStore } from '../useSessionStore'

// Reset store state before each test
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
```

- [ ] **Step 6.2: Run — expect FAIL**

```bash
npm test -- store/__tests__/useSessionStore.test.ts
```

Expected: FAIL with `Cannot find module '../useSessionStore'`.

- [ ] **Step 6.3: Create `store/useSessionStore.ts`**

```typescript
// store/useSessionStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FAI, Technology, Phase, PaymentMethod, ChatMessage } from '@/types'
import { buildNotifySummary as buildSummary } from '@/lib/telegram'

interface SessionState {
  // Onboarding
  consentGiven: boolean
  technology: Technology | null
  fai: FAI | null

  // Chat
  messages: ChatMessage[]
  currentNodeId: string | null
  phase: Phase

  // Payment
  paymentMethod: PaymentMethod | null

  // Actions
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
  technology: null,
  fai: null,
  messages: [],
  currentNodeId: null,
  phase: 'onboarding' as Phase,
  paymentMethod: null,
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setConsent: (v) => set({ consentGiven: v }),

      setProfile: (technology, fai) => set({ technology, fai }),

      addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),

      advanceNode: (nodeId) => set({ currentNodeId: nodeId }),

      setPhase: (phase) => set({ phase }),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      resetSession: () => set({ ...initialState }),

      buildNotifySummary: () => buildSummary(get().messages),
    }),
    {
      name: 'homecare-session',
      // Only persist lightweight profile data — never messages (LPD compliance)
      partialize: (state) => ({
        consentGiven: state.consentGiven,
        technology: state.technology,
        fai: state.fai,
      }),
    }
  )
)
```

- [ ] **Step 6.4: Run tests — expect PASS**

```bash
npm test -- store/__tests__/useSessionStore.test.ts
```

Expected: 6 tests PASS.

- [ ] **Step 6.5: Commit**

```bash
git add store/
git commit -m "feat: add Zustand session store with partial localStorage persist"
```

---

## Task 7: `useDiagnosticEngine` Hook

**Files:**
- Create: `hooks/useDiagnosticEngine.ts`
- Create: `hooks/__tests__/useDiagnosticEngine.test.ts`

- [ ] **Step 7.1: Write failing tests**

```typescript
// hooks/__tests__/useDiagnosticEngine.test.ts
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
    expect(result.current.currentNode).not.toBeNull()
    expect(result.current.currentNode?.id).toBe('q1')
  })

  it('navigate() advances to next node', () => {
    const { result } = renderHook(() => useDiagnosticEngine())
    act(() => {
      result.current.navigate('q2')
    })
    expect(result.current.currentNode?.id).toBe('q2')
  })

  it('isResolved is true when currentNodeId is RESOLVED', () => {
    const { result } = renderHook(() => useDiagnosticEngine())
    act(() => {
      result.current.navigate('RESOLVED')
    })
    expect(result.current.isResolved).toBe(true)
    expect(result.current.isEscalated).toBe(false)
  })

  it('isEscalated is true when currentNodeId is ESCALATE', () => {
    const { result } = renderHook(() => useDiagnosticEngine())
    act(() => {
      result.current.navigate('ESCALATE')
    })
    expect(result.current.isEscalated).toBe(true)
    expect(result.current.isResolved).toBe(false)
  })

  it('returns null checklist when fai/technology not set', () => {
    useSessionStore.getState().resetSession()
    const { result } = renderHook(() => useDiagnosticEngine())
    expect(result.current.currentNode).toBeNull()
  })
})
```

- [ ] **Step 7.2: Run — expect FAIL**

```bash
npm test -- hooks/__tests__/useDiagnosticEngine.test.ts
```

Expected: FAIL with `Cannot find module '../useDiagnosticEngine'`.

- [ ] **Step 7.3: Create `hooks/useDiagnosticEngine.ts`**

```typescript
// hooks/useDiagnosticEngine.ts
'use client'
import { useSessionStore } from '@/store/useSessionStore'
import { getChecklist } from '@/data/checklists'
import type { DiagnosticNode, Checklist } from '@/types'

interface DiagnosticEngineResult {
  checklist: Checklist | null
  currentNode: DiagnosticNode | null
  isResolved: boolean
  isEscalated: boolean
  /** Call with option.next to advance the tree */
  navigate: (next: string) => void
  /** Reset to entry node */
  restart: () => void
}

export function useDiagnosticEngine(): DiagnosticEngineResult {
  const { fai, technology, currentNodeId, advanceNode } = useSessionStore()

  const checklist =
    fai && technology ? getChecklist(fai, technology) : null

  const effectiveNodeId = currentNodeId ?? checklist?.entry ?? null

  const currentNode =
    effectiveNodeId &&
    effectiveNodeId !== 'RESOLVED' &&
    effectiveNodeId !== 'ESCALATE' &&
    checklist
      ? (checklist.nodes[effectiveNodeId] ?? null)
      : null

  const isResolved = effectiveNodeId === 'RESOLVED'
  const isEscalated = effectiveNodeId === 'ESCALATE'

  function navigate(next: string): void {
    advanceNode(next)
  }

  function restart(): void {
    if (checklist) advanceNode(checklist.entry)
  }

  return { checklist, currentNode, isResolved, isEscalated, navigate, restart }
}
```

- [ ] **Step 7.4: Run tests — expect PASS**

```bash
npm test -- hooks/__tests__/useDiagnosticEngine.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 7.5: Commit**

```bash
git add hooks/
git commit -m "feat: add useDiagnosticEngine hook"
```

---

## Task 8: `useTelegramContext` Hook

**Files:**
- Create: `hooks/useTelegramContext.ts`

- [ ] **Step 8.1: Create `hooks/useTelegramContext.ts`**

```typescript
// hooks/useTelegramContext.ts
'use client'
import { useEffect, useState } from 'react'
import { isTMA, expandTMA, setTMAHeaderColor } from '@/lib/telegram'

interface TelegramContext {
  isTelegramApp: boolean
  isReady: boolean
}

/**
 * Detects TMA vs standalone context and applies Telegram-specific UI setup.
 * Safe to call during SSR (returns false for isTelegramApp).
 */
export function useTelegramContext(): TelegramContext {
  const [isTelegramApp, setIsTelegramApp] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const tma = isTMA()
    setIsTelegramApp(tma)

    if (tma) {
      expandTMA()
      setTMAHeaderColor('#0a1628')
    }

    setIsReady(true)
  }, [])

  return { isTelegramApp, isReady }
}
```

- [ ] **Step 8.2: Commit**

```bash
git add hooks/useTelegramContext.ts
git commit -m "feat: add useTelegramContext hook"
```

---

## Task 9: Root Layout + Entry Redirect

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Create: `app/globals.css` (update theme colors)

- [ ] **Step 9.1: Update `app/globals.css`** — add HomeCare IT brand colors

Open `app/globals.css` and replace the `:root` block with:

```css
@import "tailwindcss";

:root {
  --background: #0a1628;
  --foreground: #f1f5f9;
  --card: #0f1f3d;
  --card-foreground: #f1f5f9;
  --border: #1e3a5f;
  --input: #1e3a5f;
  --primary: #2563eb;
  --primary-foreground: #ffffff;
  --muted: #1e293b;
  --muted-foreground: #64748b;
  --accent: #1e3a5f;
  --radius: 0.75rem;
}
```

- [ ] **Step 9.2: Update `app/layout.tsx`**

```typescript
// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HomeCare IT',
  description: "L'appli qui diagnostique, l'humain qui dépanne.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HomeCare IT',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a1628',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${inter.className} bg-[#0a1628] text-slate-100 min-h-dvh`}
      >
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 9.3: Update `app/page.tsx`** — redirect based on session state

```typescript
// app/page.tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/store/useSessionStore'

export default function HomePage() {
  const router = useRouter()
  const { consentGiven, technology, fai } = useSessionStore()

  useEffect(() => {
    const hasProfile = consentGiven && technology !== null && fai !== null
    router.replace(hasProfile ? '/chat' : '/onboarding')
  }, [consentGiven, technology, fai, router])

  // Show nothing while redirecting
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#0a1628]">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
```

- [ ] **Step 9.4: Run dev server to verify no build errors**

```bash
npm run dev -- --port 3001
```

Open http://localhost:3001 — expected: redirects to `/onboarding` (404 for now, which is fine).

Stop the server with Ctrl+C.

- [ ] **Step 9.5: Commit**

```bash
git add app/
git commit -m "feat: root layout + entry redirect logic"
```

---

## Task 10: Onboarding Components

**Files:**
- Create: `components/onboarding/ConsentCheckbox.tsx`
- Create: `components/onboarding/TechSelector.tsx`
- Create: `components/onboarding/FaiSelector.tsx`
- Create: `components/onboarding/__tests__/ConsentCheckbox.test.tsx`
- Create: `components/onboarding/__tests__/TechSelector.test.tsx`

- [ ] **Step 10.1: Write failing tests**

```typescript
// components/onboarding/__tests__/ConsentCheckbox.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ConsentCheckbox } from '../ConsentCheckbox'

describe('ConsentCheckbox', () => {
  it('renders unchecked by default', () => {
    render(<ConsentCheckbox checked={false} onChange={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
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
```

```typescript
// components/onboarding/__tests__/TechSelector.test.tsx
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

  it('highlights selected technology', () => {
    render(<TechSelector selected="vdsl" onSelect={vi.fn()} />)
    const vdslBtn = screen.getByText('VDSL').closest('button')
    expect(vdslBtn).toHaveClass('border-blue-500')
  })
})
```

- [ ] **Step 10.2: Run — expect FAIL**

```bash
npm test -- components/onboarding/__tests__/
```

Expected: FAIL with module not found.

- [ ] **Step 10.3: Create `components/onboarding/ConsentCheckbox.tsx`**

```typescript
// components/onboarding/ConsentCheckbox.tsx
'use client'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function ConsentCheckbox({ checked, onChange }: Props) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-950/30 border border-blue-800/30">
      <Checkbox
        id="consent"
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5 border-blue-500 data-[state=checked]:bg-blue-600"
      />
      <Label
        htmlFor="consent"
        className="text-xs text-slate-400 leading-relaxed cursor-pointer"
      >
        J&apos;accepte le traitement local de mes données pour le diagnostic
        (LPD/RGPD — aucune donnée transmise sans mon consentement)
      </Label>
    </div>
  )
}
```

- [ ] **Step 10.4: Create `components/onboarding/TechSelector.tsx`**

```typescript
// components/onboarding/TechSelector.tsx
'use client'
import { Button } from '@/components/ui/button'
import type { Technology } from '@/types'

const options: { label: string; value: Technology }[] = [
  { label: 'Fibre OTO', value: 'fibre_oto' },
  { label: 'VDSL', value: 'vdsl' },
  { label: 'Câble', value: 'cable' },
]

interface Props {
  selected: Technology | null
  onSelect: (tech: Technology) => void
}

export function TechSelector({ selected, onSelect }: Props) {
  return (
    <div className="flex gap-2">
      {options.map(({ label, value }) => (
        <Button
          key={value}
          variant="outline"
          size="sm"
          onClick={() => onSelect(value)}
          className={`flex-1 text-xs border transition-colors ${
            selected === value
              ? 'border-blue-500 bg-blue-600/20 text-blue-300'
              : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-blue-600'
          }`}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
```

- [ ] **Step 10.5: Create `components/onboarding/FaiSelector.tsx`**

```typescript
// components/onboarding/FaiSelector.tsx
'use client'
import { Button } from '@/components/ui/button'
import type { FAI } from '@/types'

const options: { label: string; value: FAI }[] = [
  { label: 'Swisscom', value: 'swisscom' },
  { label: 'Salt', value: 'salt' },
  { label: 'Sunrise', value: 'sunrise' },
  { label: 'Net+', value: 'netplus' },
  { label: 'Autre', value: 'autre' },
]

interface Props {
  selected: FAI | null
  onSelect: (fai: FAI) => void
}

export function FaiSelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(({ label, value }) => (
        <Button
          key={value}
          variant="outline"
          onClick={() => onSelect(value)}
          className={`h-10 text-sm font-medium border transition-colors ${
            selected === value
              ? 'border-blue-500 bg-blue-600/20 text-blue-300'
              : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-blue-600'
          } ${value === 'autre' ? 'col-span-2' : ''}`}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
```

- [ ] **Step 10.6: Run tests — expect PASS**

```bash
npm test -- components/onboarding/__tests__/
```

Expected: all tests PASS.

- [ ] **Step 10.7: Commit**

```bash
git add components/onboarding/
git commit -m "feat: add onboarding components (consent, tech, FAI)"
```

---

## Task 11: Onboarding Page

**Files:**
- Create: `app/onboarding/page.tsx`

- [ ] **Step 11.1: Create `app/onboarding/page.tsx`**

```typescript
// app/onboarding/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConsentCheckbox } from '@/components/onboarding/ConsentCheckbox'
import { TechSelector } from '@/components/onboarding/TechSelector'
import { FaiSelector } from '@/components/onboarding/FaiSelector'
import { useSessionStore } from '@/store/useSessionStore'
import { useTelegramContext } from '@/hooks/useTelegramContext'
import type { Technology, FAI } from '@/types'

export default function OnboardingPage() {
  const router = useRouter()
  useTelegramContext()

  const { setConsent, setProfile } = useSessionStore()

  const [consent, setLocalConsent] = useState(false)
  const [tech, setTech] = useState<Technology | null>(null)
  const [fai, setFai] = useState<FAI | null>(null)

  const canStart = consent && tech !== null && fai !== null

  function handleStart() {
    if (!canStart) return
    setConsent(true)
    setProfile(tech!, fai!)
    router.push('/chat')
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-8 bg-[#0a1628]">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Logo */}
        <div className="text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg shadow-blue-900/50 mb-3">
            🛠️
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            HomeCare IT
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            L&apos;appli qui diagnostique, l&apos;humain qui dépanne.
          </p>
        </div>

        {/* Consent */}
        <ConsentCheckbox
          checked={consent}
          onChange={setLocalConsent}
        />

        {/* Technology */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">
            Votre technologie
          </p>
          <TechSelector selected={tech} onSelect={setTech} />
        </div>

        {/* FAI */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">
            Votre opérateur
          </p>
          <FaiSelector selected={fai} onSelect={setFai} />
        </div>

        {/* CTA */}
        <Button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-lg shadow-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Démarrer le diagnostic →
        </Button>
      </div>
    </main>
  )
}
```

- [ ] **Step 11.2: Verify in browser**

```bash
npm run dev -- --port 3001
```

Open http://localhost:3001 → should land on `/onboarding`, show the form. Fill it in → should redirect to `/chat` (404 for now). Stop with Ctrl+C.

- [ ] **Step 11.3: Commit**

```bash
git add app/onboarding/
git commit -m "feat: onboarding page (consent + tech + FAI)"
```

---

## Task 12: Chat Components

**Files:**
- Create: `components/chat/ChatBubble.tsx`
- Create: `components/chat/TypingIndicator.tsx`
- Create: `components/chat/QuickReplyButtons.tsx`
- Create: `components/chat/__tests__/ChatBubble.test.tsx`
- Create: `components/chat/__tests__/QuickReplyButtons.test.tsx`

- [ ] **Step 12.1: Write failing tests**

```typescript
// components/chat/__tests__/ChatBubble.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChatBubble } from '../ChatBubble'

describe('ChatBubble', () => {
  it('renders bot bubble with content', () => {
    render(<ChatBubble role="bot" content="Bonjour !" />)
    expect(screen.getByText('Bonjour !')).toBeInTheDocument()
  })

  it('renders user bubble with content', () => {
    render(<ChatBubble role="user" content="Totalement coupée" />)
    expect(screen.getByText('Totalement coupée')).toBeInTheDocument()
  })

  it('bot bubble has left-aligned class', () => {
    const { container } = render(<ChatBubble role="bot" content="Test" />)
    expect(container.firstChild).toHaveClass('justify-start')
  })

  it('user bubble has right-aligned class', () => {
    const { container } = render(<ChatBubble role="user" content="Test" />)
    expect(container.firstChild).toHaveClass('justify-end')
  })
})
```

```typescript
// components/chat/__tests__/QuickReplyButtons.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QuickReplyButtons } from '../QuickReplyButtons'
import type { DiagnosticOption } from '@/types'

const options: DiagnosticOption[] = [
  { label: 'Oui', next: 'q2' },
  { label: 'Non', next: 'ESCALATE' },
]

describe('QuickReplyButtons', () => {
  it('renders all options', () => {
    render(<QuickReplyButtons options={options} onSelect={vi.fn()} />)
    expect(screen.getByText('Oui')).toBeInTheDocument()
    expect(screen.getByText('Non')).toBeInTheDocument()
  })

  it('calls onSelect with option when clicked', () => {
    const onSelect = vi.fn()
    render(<QuickReplyButtons options={options} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Oui'))
    expect(onSelect).toHaveBeenCalledWith(options[0])
  })

  it('disables all buttons when disabled prop is true', () => {
    render(<QuickReplyButtons options={options} onSelect={vi.fn()} disabled />)
    screen.getAllByRole('button').forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })
})
```

- [ ] **Step 12.2: Run — expect FAIL**

```bash
npm test -- components/chat/__tests__/
```

Expected: FAIL with module not found.

- [ ] **Step 12.3: Create `components/chat/ChatBubble.tsx`**

```typescript
// components/chat/ChatBubble.tsx
import { sanitize } from '@/lib/sanitize'

interface Props {
  role: 'bot' | 'user'
  content: string
}

export function ChatBubble({ role, content }: Props) {
  const isBot = role === 'bot'
  const safeContent = sanitize(content)

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isBot
            ? 'bg-[#0f1f3d] border border-slate-700/50 text-slate-300 rounded-bl-sm'
            : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm'
        }`}
      >
        {safeContent}
      </div>
    </div>
  )
}
```

- [ ] **Step 12.4: Create `components/chat/TypingIndicator.tsx`**

```typescript
// components/chat/TypingIndicator.tsx
export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-[#0f1f3d] border border-slate-700/50 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 12.5: Create `components/chat/QuickReplyButtons.tsx`**

```typescript
// components/chat/QuickReplyButtons.tsx
import { Button } from '@/components/ui/button'
import type { DiagnosticOption } from '@/types'

interface Props {
  options: DiagnosticOption[]
  onSelect: (option: DiagnosticOption) => void
  disabled?: boolean
}

export function QuickReplyButtons({ options, onSelect, disabled = false }: Props) {
  return (
    <div className="flex flex-col gap-2 pt-1">
      <p className="text-[10px] text-slate-500 uppercase tracking-widest">
        Choisissez une réponse
      </p>
      {options.map((opt) => (
        <Button
          key={opt.next + opt.label}
          variant="outline"
          onClick={() => onSelect(opt)}
          disabled={disabled}
          className="w-full text-sm text-left justify-start border-slate-700 bg-slate-900/50 text-blue-300 hover:border-blue-600 hover:bg-blue-900/20 disabled:opacity-40 h-auto py-2.5 px-3"
        >
          {opt.label}
        </Button>
      ))}
    </div>
  )
}
```

- [ ] **Step 12.6: Run tests — expect PASS**

```bash
npm test -- components/chat/__tests__/
```

Expected: all tests PASS.

- [ ] **Step 12.7: Commit**

```bash
git add components/chat/
git commit -m "feat: add chat components (bubble, typing, quick-replies)"
```

---

## Task 13: Upsell & Payment Components

**Files:**
- Create: `components/chat/UpsellCard.tsx`
- Create: `components/payment/TwintQR.tsx`
- Create: `components/payment/PayOnSite.tsx`
- Create: `components/chat/__tests__/UpsellCard.test.tsx`

- [ ] **Step 13.1: Write failing test**

```typescript
// components/chat/__tests__/UpsellCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { UpsellCard } from '../UpsellCard'

describe('UpsellCard', () => {
  it('renders price and pack name', () => {
    render(<UpsellCard onActivate={vi.fn()} onSkip={vi.fn()} />)
    expect(screen.getByText(/89 CHF/)).toBeInTheDocument()
    expect(screen.getByText(/Pack Annuel Tranquillité/)).toBeInTheDocument()
  })

  it('calls onActivate when CTA is clicked', () => {
    const onActivate = vi.fn()
    render(<UpsellCard onActivate={onActivate} onSkip={vi.fn()} />)
    fireEvent.click(screen.getByText(/Activer le Pack VIP/))
    expect(onActivate).toHaveBeenCalled()
  })

  it('calls onSkip when secondary CTA is clicked', () => {
    const onSkip = vi.fn()
    render(<UpsellCard onActivate={vi.fn()} onSkip={onSkip} />)
    fireEvent.click(screen.getByText(/sans pack/i))
    expect(onSkip).toHaveBeenCalled()
  })
})
```

- [ ] **Step 13.2: Run — expect FAIL**

```bash
npm test -- components/chat/__tests__/UpsellCard.test.tsx
```

Expected: FAIL with module not found.

- [ ] **Step 13.3: Create `components/chat/UpsellCard.tsx`**

```typescript
// components/chat/UpsellCard.tsx
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface Props {
  onActivate: () => void
  onSkip: () => void
}

const FEATURES = [
  'Support N1 illimité',
  'Déplacement offert',
  'Tarif horaire VIP 70 CHF/h',
]

export function UpsellCard({ onActivate, onSkip }: Props) {
  return (
    <Card className="bg-gradient-to-br from-[#0f1f3d] to-[#0a1628] border border-blue-700/40 rounded-2xl p-4 shadow-xl shadow-blue-950/50">
      <Badge className="mb-3 bg-blue-600/20 text-blue-300 border border-blue-700/40 text-[10px] uppercase tracking-widest">
        ⭐ Offre recommandée
      </Badge>

      <h3 className="text-base font-bold text-slate-100 mb-1">
        Pack Annuel Tranquillité
      </h3>

      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-3xl font-extrabold text-blue-400">89 CHF</span>
        <span className="text-xs text-slate-500">/an</span>
      </div>

      <ul className="space-y-1.5 mb-3">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-green-400 font-bold">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <p className="text-[10px] text-slate-600 line-through mb-4">
        Sans pack : 120 CHF/h + frais de déplacement
      </p>

      <Button
        onClick={onActivate}
        className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-md shadow-blue-900/40"
      >
        Activer le Pack VIP à 89 CHF →
      </Button>

      <Separator className="my-3 bg-slate-800" />

      <button
        onClick={onSkip}
        className="w-full text-[11px] text-slate-500 hover:text-slate-400 underline underline-offset-2 transition-colors"
      >
        Réserver une intervention sans pack (120 CHF/h)
      </button>
    </Card>
  )
}
```

- [ ] **Step 13.4: Create `components/payment/TwintQR.tsx`**

```typescript
// components/payment/TwintQR.tsx
import { Card } from '@/components/ui/card'

export function TwintQR() {
  return (
    <Card className="bg-[#0f1f3d] border border-blue-700/30 rounded-2xl p-5 flex flex-col items-center gap-4 text-center">
      <h3 className="text-sm font-semibold text-slate-200">
        💳 Payer par TWINT
      </h3>

      {/* QR placeholder */}
      <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg">
        <div className="w-full h-full grid grid-cols-7 grid-rows-7 gap-px opacity-20">
          {Array.from({ length: 49 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-sm ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Scannez avec TWINT pour régler{' '}
        <span className="font-semibold text-slate-200">89 CHF</span>
      </p>
      <p className="text-[10px] text-slate-600">
        QR code définitif transmis lors de la confirmation de rendez-vous.
      </p>
    </Card>
  )
}
```

- [ ] **Step 13.5: Create `components/payment/PayOnSite.tsx`**

```typescript
// components/payment/PayOnSite.tsx
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function PayOnSite() {
  return (
    <Card className="bg-[#0f1f3d] border border-green-700/30 rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
      <div className="text-3xl">🏠</div>

      <Badge className="bg-green-600/20 text-green-400 border border-green-700/40 text-[10px] uppercase tracking-widest">
        ✓ Statut VIP pré-activé
      </Badge>

      <p className="text-sm text-slate-300 leading-relaxed">
        Parfait ! Le technicien vous contactera pour convenir d&apos;un rendez-vous.
        Il encaissera la somme à son arrivée.
      </p>

      <p className="text-xs text-slate-500">
        Secteur d&apos;intervention : Oron et environs
      </p>
    </Card>
  )
}
```

- [ ] **Step 13.6: Run tests — expect PASS**

```bash
npm test -- components/chat/__tests__/UpsellCard.test.tsx
```

Expected: 3 tests PASS.

- [ ] **Step 13.7: Commit**

```bash
git add components/chat/UpsellCard.tsx components/payment/
git commit -m "feat: upsell card + payment components (TWINT QR, PayOnSite)"
```

---

## Task 14: Chat Page (Phase 2→3→4)

**Files:**
- Create: `app/chat/page.tsx`

- [ ] **Step 14.1: Create `app/chat/page.tsx`**

```typescript
// app/chat/page.tsx
'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { TypingIndicator } from '@/components/chat/TypingIndicator'
import { QuickReplyButtons } from '@/components/chat/QuickReplyButtons'
import { UpsellCard } from '@/components/chat/UpsellCard'
import { TwintQR } from '@/components/payment/TwintQR'
import { PayOnSite } from '@/components/payment/PayOnSite'
import { useSessionStore } from '@/store/useSessionStore'
import { useDiagnosticEngine } from '@/hooks/useDiagnosticEngine'
import { useTelegramContext } from '@/hooks/useTelegramContext'
import type { DiagnosticOption, PaymentMethod } from '@/types'

const TYPING_DELAY_MS = 600

export default function ChatPage() {
  const router = useRouter()
  useTelegramContext()

  const {
    messages,
    addMessage,
    phase,
    setPhase,
    setPaymentMethod,
    fai,
    technology,
    buildNotifySummary,
  } = useSessionStore()

  const { currentNode, isResolved, isEscalated, navigate } = useDiagnosticEngine()

  const [isTyping, setIsTyping] = useState(false)
  const [buttonsDisabled, setButtonsDisabled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  // Redirect to onboarding if no profile
  useEffect(() => {
    if (!fai || !technology) {
      router.replace('/onboarding')
    }
  }, [fai, technology, router])

  // Add first bot message on mount
  useEffect(() => {
    if (initialized.current || messages.length > 0 || !currentNode) return
    initialized.current = true
    addMessage({
      id: crypto.randomUUID(),
      role: 'bot',
      content: 'Bonjour ! Je suis votre assistant HomeCare IT. Je vais vous guider pas à pas pour résoudre votre problème.',
      timestamp: Date.now(),
    })
    setTimeout(() => {
      addMessage({
        id: crypto.randomUUID(),
        role: 'bot',
        content: currentNode.question,
        timestamp: Date.now(),
      })
    }, TYPING_DELAY_MS)
  }, [currentNode, messages.length, addMessage])

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Handle escalation → switch to upsell phase
  useEffect(() => {
    if (isEscalated && phase === 'diagnostic') {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        addMessage({
          id: crypto.randomUUID(),
          role: 'bot',
          content: 'Nous avons épuisé les solutions à distance. Une intervention sur place est nécessaire dans votre secteur (Oron et environs).',
          timestamp: Date.now(),
        })
        setPhase('upsell')
      }, TYPING_DELAY_MS)
    }
  }, [isEscalated, phase, setPhase, addMessage])

  // Handle resolution
  useEffect(() => {
    if (isResolved && phase === 'diagnostic') {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        addMessage({
          id: crypto.randomUUID(),
          role: 'bot',
          content: '✅ Excellent ! Votre connexion semble rétablie. N\'hésitez pas à nous recontacter si le problème persiste.',
          timestamp: Date.now(),
        })
        setPhase('upsell') // show upsell even after resolution (soft)
      }, TYPING_DELAY_MS)
    }
  }, [isResolved, phase, setPhase, addMessage])

  const handleOptionSelect = useCallback(
    (option: DiagnosticOption) => {
      if (buttonsDisabled) return
      setButtonsDisabled(true)

      // Add user message
      addMessage({
        id: crypto.randomUUID(),
        role: 'user',
        content: option.label,
        timestamp: Date.now(),
      })

      navigate(option.next)

      if (option.next !== 'RESOLVED' && option.next !== 'ESCALATE') {
        // Show next bot question after typing delay
        setIsTyping(true)
        setTimeout(() => {
          setIsTyping(false)
          // currentNode will update on next render via navigate()
          setButtonsDisabled(false)
        }, TYPING_DELAY_MS)
      }
    },
    [buttonsDisabled, addMessage, navigate]
  )

  async function sendNotification(method: PaymentMethod) {
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technology,
          fai,
          summary: buildNotifySummary(),
          paymentMethod: method,
        }),
      })
    } catch {
      // Notification failure is non-blocking — user flow continues
    }
  }

  function handleActivatePack() {
    setPhase('payment')
  }

  async function handleSkipPack() {
    await sendNotification('on_site_no_pack')
    addMessage({
      id: crypto.randomUUID(),
      role: 'bot',
      content: 'Entendu. Le technicien vous contactera pour convenir d\'un rendez-vous au tarif standard de 120 CHF/h.',
      timestamp: Date.now(),
    })
    setPhase('payment')
  }

  async function handleTwint() {
    setPaymentMethod('twint')
    await sendNotification('twint')
  }

  async function handleOnSite() {
    setPaymentMethod('on_site')
    await sendNotification('on_site')
  }

  return (
    <main className="min-h-dvh flex flex-col bg-[#0a1628] max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 flex-shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-lg shadow shadow-blue-900/50 flex-shrink-0">
          🤖
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">HomeCare IT</p>
          <p className="text-[10px] text-green-400">● En ligne</p>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef as React.Ref<HTMLDivElement>}>
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} role={msg.role} content={msg.content} />
          ))}

          {isTyping && <TypingIndicator />}

          {/* Upsell card */}
          {phase === 'upsell' && !isTyping && (
            <UpsellCard onActivate={handleActivatePack} onSkip={handleSkipPack} />
          )}

          {/* Payment phase */}
          {phase === 'payment' && (
            <div className="flex flex-col gap-3">
              {useSessionStore.getState().paymentMethod === null && (
                <>
                  <p className="text-xs text-slate-400 text-center">
                    Comment souhaitez-vous régler ?
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleTwint}
                      className="w-full p-3 rounded-xl bg-[#0f1f3d] border border-blue-700/30 text-sm text-slate-200 hover:border-blue-500 transition-colors"
                    >
                      💳 Payer maintenant par TWINT
                    </button>
                    <button
                      onClick={handleOnSite}
                      className="w-full p-3 rounded-xl bg-[#0f1f3d] border border-slate-700 text-sm text-slate-200 hover:border-blue-500 transition-colors"
                    >
                      🏠 Payer au technicien sur place
                    </button>
                  </div>
                </>
              )}
              {useSessionStore.getState().paymentMethod === 'twint' && <TwintQR />}
              {(useSessionStore.getState().paymentMethod === 'on_site' ||
                useSessionStore.getState().paymentMethod === 'on_site_no_pack') && <PayOnSite />}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick replies (diagnostic phase only) */}
      {phase === 'diagnostic' && currentNode && !isTyping && (
        <div className="px-4 py-3 border-t border-slate-800 flex-shrink-0">
          <QuickReplyButtons
            options={currentNode.options}
            onSelect={handleOptionSelect}
            disabled={buttonsDisabled}
          />
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 14.2: Verify full flow in browser**

```bash
npm run dev -- --port 3001
```

Walk through the full flow:
1. http://localhost:3001 → redirects to `/onboarding`
2. Accept consent, pick VDSL + Swisscom, click "Démarrer"
3. Chat opens, bot asks first question
4. Answer questions until `ESCALATE` or `RESOLVED`
5. Upsell card appears → click "Activer"
6. Payment options appear → click TWINT or Sur place

Stop with Ctrl+C.

- [ ] **Step 14.3: Commit**

```bash
git add app/chat/
git commit -m "feat: chat page with diagnostic → upsell → payment flow"
```

---

## Task 15: Edge API `/api/notify`

**Files:**
- Create: `app/api/notify/route.ts`
- Create: `app/api/notify/__tests__/route.test.ts`

- [ ] **Step 15.1: Write failing tests**

```typescript
// app/api/notify/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
  // Set env vars for test
  process.env.TELEGRAM_BOT_TOKEN = 'test_token'
  process.env.TELEGRAM_CHAT_ID = '123456'
})

describe('POST /api/notify', () => {
  it('returns 400 for missing required fields', async () => {
    const { POST } = await import('../route')
    const req = new Request('http://localhost/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technology: 'vdsl' }), // missing fai, summary, paymentMethod
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 and calls Telegram API with valid payload', async () => {
    const { POST } = await import('../route')
    const req = new Request('http://localhost/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        technology: 'vdsl',
        fai: 'swisscom',
        summary: 'Connexion coupée → Totalement',
        paymentMethod: 'twint',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api.telegram.org'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('returns 200 even if Telegram API fails (non-blocking)', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const { POST } = await import('../route')
    const req = new Request('http://localhost/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        technology: 'vdsl',
        fai: 'swisscom',
        summary: 'test',
        paymentMethod: 'on_site',
      }),
    })
    const res = await POST(req)
    // Should still return 200 — Telegram failure is non-fatal
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 15.2: Run — expect FAIL**

```bash
npm test -- app/api/notify/__tests__/route.test.ts
```

Expected: FAIL with module not found.

- [ ] **Step 15.3: Create `app/api/notify/route.ts`**

```typescript
// app/api/notify/route.ts
import { z } from 'zod'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

const NotifySchema = z.object({
  technology: z.enum(['fibre_oto', 'vdsl', 'cable']),
  fai: z.enum(['swisscom', 'salt', 'sunrise', 'netplus', 'autre']),
  summary: z.string().min(1).max(2000),
  paymentMethod: z.enum(['twint', 'on_site', 'on_site_no_pack']),
})

const FAI_LABELS: Record<string, string> = {
  swisscom: 'Swisscom',
  salt: 'Salt',
  sunrise: 'Sunrise',
  netplus: 'Net+',
  autre: 'Autre',
}

const TECH_LABELS: Record<string, string> = {
  fibre_oto: 'Fibre OTO',
  vdsl: 'VDSL',
  cable: 'Câble',
}

const PAYMENT_LABELS: Record<string, string> = {
  twint: 'TWINT',
  on_site: 'Sur place (Pack VIP)',
  on_site_no_pack: 'Sur place (sans pack)',
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = NotifySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { technology, fai, summary, paymentMethod } = result.data

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (token && chatId) {
    const text = [
      '🔔 *Nouvelle demande d\'intervention HomeCare IT*',
      '',
      `👤 Opérateur : ${FAI_LABELS[fai]} | Technologie : ${TECH_LABELS[technology]}`,
      `💳 Paiement : ${PAYMENT_LABELS[paymentMethod]}`,
      `📋 Parcours : ${summary}`,
    ].join('\n')

    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      })
    } catch {
      // Telegram notification failure is non-blocking
      // The user flow must not be interrupted
    }
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 15.4: Run tests — expect PASS**

```bash
npm test -- app/api/notify/__tests__/route.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 15.5: Commit**

```bash
git add app/api/
git commit -m "feat: edge API /api/notify with Zod validation + Telegram Bot"
```

---

## Task 16: Security — CSP Headers + next.config.ts

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 16.1: Update `next.config.ts`**

```typescript
// next.config.ts
import type { NextConfig } from 'next'
import withPWA from '@ducanh2912/next-pwa'

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://telegram.org",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "connect-src 'self' https://api.telegram.org",
            "frame-ancestors 'none'",
          ].join('; '),
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ],
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig)
```

- [ ] **Step 16.2: Verify build passes**

```bash
npm run build --silent 2>&1 | tail -5
```

Expected: `✓ Compiled successfully` (or similar green output). Fix any TypeScript errors before proceeding.

- [ ] **Step 16.3: Commit**

```bash
git add next.config.ts
git commit -m "feat: CSP headers + next-pwa config"
```

---

## Task 17: PWA Manifest + Icons

**Files:**
- Create: `public/manifest.json`
- Create: `public/icons/icon-192.png` (placeholder)
- Create: `public/icons/icon-512.png` (placeholder)

- [ ] **Step 17.1: Create `public/manifest.json`**

```json
{
  "name": "HomeCare IT",
  "short_name": "HomeCare IT",
  "description": "L'appli qui diagnostique, l'humain qui dépanne.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a1628",
  "theme_color": "#0a1628",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 17.2: Generate placeholder icons**

```bash
# Create a minimal valid PNG using Node (no ImageMagick required)
node -e "
const { createCanvas } = require('canvas') || (() => null)();
// Fallback: copy a placeholder SVG converted inline
" 2>/dev/null || true

# If canvas not available, create 1×1 transparent PNGs as placeholders
mkdir -p public/icons
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd4n\x00\x00\x00\x00IEND\xaeB`\x82' > public/icons/icon-192.png
cp public/icons/icon-192.png public/icons/icon-512.png
echo "Placeholder icons created — replace with real 192×192 and 512×512 PNG before production deploy."
```

> **Note:** Replace `public/icons/icon-192.png` and `public/icons/icon-512.png` with real branded icons (HomeCare IT logo on `#0a1628` background) before going to production.

- [ ] **Step 17.3: Commit**

```bash
git add public/
git commit -m "feat: PWA manifest + placeholder icons"
```

---

## Task 18: Full Test Suite Run

- [ ] **Step 18.1: Run all tests**

```bash
npm test
```

Expected output (all green):
```
✓ data/__tests__/checklists.test.ts (4 tests)
✓ lib/__tests__/sanitize.test.ts (3 tests)
✓ lib/__tests__/telegram.test.ts (1 test)
✓ store/__tests__/useSessionStore.test.ts (6 tests)
✓ hooks/__tests__/useDiagnosticEngine.test.ts (5 tests)
✓ components/onboarding/__tests__/ConsentCheckbox.test.tsx (3 tests)
✓ components/onboarding/__tests__/TechSelector.test.tsx (3 tests)
✓ components/chat/__tests__/ChatBubble.test.tsx (4 tests)
✓ components/chat/__tests__/QuickReplyButtons.test.tsx (3 tests)
✓ components/chat/__tests__/UpsellCard.test.tsx (3 tests)
✓ app/api/notify/__tests__/route.test.ts (3 tests)

Test Files  11 passed
Tests       38 passed
```

If any test fails, fix it before proceeding.

- [ ] **Step 18.2: Full production build**

```bash
npm run build
```

Expected: `✓ Compiled successfully`, no TypeScript errors, no missing modules.

- [ ] **Step 18.3: Commit**

```bash
git add -A
git commit -m "test: full test suite green + production build verified"
```

---

## Task 19: Deploy to Vercel

- [ ] **Step 19.1: Create Vercel project**

```bash
npm exec -- vercel --prod
```

Follow the prompts: link to your Vercel account, create new project `homecare-it`, deploy.

- [ ] **Step 19.2: Set environment variables**

```bash
printf "your_actual_bot_token" | npx vercel env add TELEGRAM_BOT_TOKEN production
printf "your_actual_chat_id" | npx vercel env add TELEGRAM_CHAT_ID production
printf "https://homecare-it.vercel.app" | npx vercel env add NEXT_PUBLIC_APP_URL production
```

> Get your Telegram Bot Token from @BotFather. Get your Chat ID by messaging @userinfobot.

- [ ] **Step 19.3: Redeploy with env vars**

```bash
npm exec -- vercel --prod
```

- [ ] **Step 19.4: Smoke test on production URL**

Open the Vercel URL:
1. Onboarding loads ✓
2. Consent + VDSL + Swisscom → Démarrer ✓
3. Chat flows through to ESCALATE ✓
4. Upsell card shows ✓
5. Activer Pack → payment options show ✓
6. Check your Telegram — notification received ✓

- [ ] **Step 19.5: Add Telegram bot webhook**

In your Telegram Bot settings (@BotFather), create a Web App pointing to your Vercel URL. This enables the TMA entry point.

---

## Self-Review Checklist

### Spec coverage
| Spec section | Covered by task |
|---|---|
| TMA + URL standalone | Task 8 (useTelegramContext) |
| Edge API /api/notify | Task 15 |
| Zustand + localStorage partial persist | Task 6 |
| checklists.ts dynamic tree | Task 4 |
| Phase 1 Onboarding + consent | Tasks 10, 11 |
| Phase 2 Chat N1 + typing | Tasks 12, 14 |
| Phase 3 Upsell card + secondary CTA | Task 13 |
| Phase 4 TWINT QR + PayOnSite | Tasks 13, 14 |
| DOMPurify XSS protection | Task 5 |
| CSP headers | Task 16 |
| PWA (skipWaiting + clientsClaim) | Task 16 |
| Zod validation on API | Task 15 |
| LPD/RGPD — no PII persisted | Task 6 |

### Notes
- **DOCX files:** When adding real N1 trees for Salt, Sunrise, Net+ — read `/Users/stormzmac/CLAUDE PROJECT/HomeCare IT/Support N1/` and add entries to `data/checklists.ts`. The integrity tests in Task 4 will catch any broken node references automatically.
- **TWINT real integration:** Replace `TwintQR.tsx` placeholder with a real QR code generated by Twint API — no other files need to change.
- **Icons:** Replace `public/icons/icon-192.png` and `icon-512.png` with real branded assets before production launch.
