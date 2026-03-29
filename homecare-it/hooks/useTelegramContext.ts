'use client'
import { useEffect, useState } from 'react'
import { isTMA, expandTMA, setTMAHeaderColor } from '@/lib/telegram'

interface TelegramContext {
  isTelegramApp: boolean
  isReady: boolean
}

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
