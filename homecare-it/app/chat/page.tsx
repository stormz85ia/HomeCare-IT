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

  const store = useSessionStore()
  const { messages, addMessage, phase, setPhase, setPaymentMethod, fai, technology, buildNotifySummary } = store

  const { currentNode, isResolved, isEscalated, navigate } = useDiagnosticEngine()

  const [isTyping, setIsTyping] = useState(false)
  const [buttonsDisabled, setButtonsDisabled] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (!fai || !technology) router.replace('/onboarding')
  }, [fai, technology, router])

  // Initial bot message
  useEffect(() => {
    if (initialized.current || messages.length > 0 || !currentNode) return
    initialized.current = true
    addMessage({ id: crypto.randomUUID(), role: 'bot', content: 'Bonjour ! Je suis votre assistant HomeCare IT. Je vais vous guider pas à pas pour résoudre votre problème.', timestamp: Date.now() })
    setTimeout(() => {
      addMessage({ id: crypto.randomUUID(), role: 'bot', content: currentNode.question, timestamp: Date.now() })
    }, TYPING_DELAY_MS)
  }, [currentNode, messages.length, addMessage])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Escalation → upsell
  useEffect(() => {
    if (isEscalated && phase === 'diagnostic') {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        addMessage({ id: crypto.randomUUID(), role: 'bot', content: "Nous avons épuisé les solutions à distance. Une intervention sur place est nécessaire dans votre secteur (Oron et environs).", timestamp: Date.now() })
        setPhase('upsell')
      }, TYPING_DELAY_MS)
    }
  }, [isEscalated, phase, setPhase, addMessage])

  // Resolution
  useEffect(() => {
    if (isResolved && phase === 'diagnostic') {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        addMessage({ id: crypto.randomUUID(), role: 'bot', content: "✅ Excellent ! Votre connexion semble rétablie. N'hésitez pas à nous recontacter si le problème persiste.", timestamp: Date.now() })
        setPhase('upsell')
      }, TYPING_DELAY_MS)
    }
  }, [isResolved, phase, setPhase, addMessage])

  const handleOptionSelect = useCallback((option: DiagnosticOption) => {
    if (buttonsDisabled) return
    setButtonsDisabled(true)
    addMessage({ id: crypto.randomUUID(), role: 'user', content: option.label, timestamp: Date.now() })
    navigate(option.next)
    if (option.next !== 'RESOLVED' && option.next !== 'ESCALATE') {
      setIsTyping(true)
      setTimeout(() => { setIsTyping(false); setButtonsDisabled(false) }, TYPING_DELAY_MS)
    }
  }, [buttonsDisabled, addMessage, navigate])

  async function sendNotification(method: PaymentMethod) {
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technology, fai, summary: buildNotifySummary(), paymentMethod: method }),
      })
    } catch { /* non-blocking */ }
  }

  async function handleSkipPack() {
    await sendNotification('on_site_no_pack')
    addMessage({ id: crypto.randomUUID(), role: 'bot', content: "Entendu. Le technicien vous contactera pour convenir d'un rendez-vous au tarif standard de 120 CHF/h.", timestamp: Date.now() })
    setPhase('payment')
    setPaymentMethod('on_site_no_pack')
  }

  async function handleTwint() {
    setPaymentMethod('twint')
    await sendNotification('twint')
  }

  async function handleOnSite() {
    setPaymentMethod('on_site')
    await sendNotification('on_site')
  }

  const paymentMethod = useSessionStore.getState().paymentMethod

  return (
    <main className="min-h-dvh flex flex-col bg-[#0a1628] max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 flex-shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-lg shadow shadow-blue-900/50 flex-shrink-0">🤖</div>
        <div>
          <p className="text-sm font-semibold text-slate-100">HomeCare IT</p>
          <p className="text-[10px] text-green-400">● En ligne</p>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="flex flex-col gap-3">
          {messages.map((msg) => <ChatBubble key={msg.id} role={msg.role} content={msg.content} />)}
          {isTyping && <TypingIndicator />}

          {phase === 'upsell' && !isTyping && (
            <UpsellCard onActivate={() => setPhase('payment')} onSkip={handleSkipPack} />
          )}

          {phase === 'payment' && (
            <div className="flex flex-col gap-3">
              {!paymentMethod && (
                <>
                  <p className="text-xs text-slate-400 text-center">Comment souhaitez-vous régler ?</p>
                  <button onClick={handleTwint}
                    className="w-full p-3 rounded-xl bg-[#0f1f3d] border border-blue-700/30 text-sm text-slate-200 hover:border-blue-500 transition-colors">
                    💳 Payer maintenant par TWINT
                  </button>
                  <button onClick={handleOnSite}
                    className="w-full p-3 rounded-xl bg-[#0f1f3d] border border-slate-700 text-sm text-slate-200 hover:border-blue-500 transition-colors">
                    🏠 Payer au technicien sur place
                  </button>
                </>
              )}
              {paymentMethod === 'twint' && <TwintQR />}
              {(paymentMethod === 'on_site' || paymentMethod === 'on_site_no_pack') && <PayOnSite />}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Quick replies */}
      {phase === 'diagnostic' && currentNode && !isTyping && (
        <div className="px-4 py-3 border-t border-slate-800 flex-shrink-0">
          <QuickReplyButtons options={currentNode.options} onSelect={handleOptionSelect} disabled={buttonsDisabled} />
        </div>
      )}
    </main>
  )
}
