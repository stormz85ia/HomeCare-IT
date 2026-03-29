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

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#0a1628]">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
