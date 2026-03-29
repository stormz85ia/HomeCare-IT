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

export function isTMA(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.Telegram !== 'undefined' &&
    !!window.Telegram.WebApp?.initData
  )
}

export function expandTMA(): void {
  if (isTMA()) window.Telegram!.WebApp.expand()
}

export function setTMAHeaderColor(color: string): void {
  if (isTMA()) window.Telegram!.WebApp.setHeaderColor(color)
}

export function buildNotifySummary(messages: ChatMessage[]): string {
  const pairs: string[] = []
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === 'bot' && messages[i + 1].role === 'user') {
      const question = messages[i].content.slice(0, 50).replace(/\n/g, ' ')
      pairs.push(`${question} → ${messages[i + 1].content}`)
    }
  }
  return pairs.join(' | ') || 'Aucun détail disponible'
}
