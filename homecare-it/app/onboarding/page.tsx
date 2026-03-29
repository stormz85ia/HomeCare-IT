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
        <div className="text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg shadow-blue-900/50 mb-3">
            🛠️
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">HomeCare IT</h1>
          <p className="text-xs text-slate-500 mt-1">L&apos;appli qui diagnostique, l&apos;humain qui dépanne.</p>
        </div>

        <ConsentCheckbox checked={consent} onChange={setLocalConsent} />

        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Votre technologie</p>
          <TechSelector selected={tech} onSelect={setTech} />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Votre opérateur</p>
          <FaiSelector selected={fai} onSelect={setFai} />
        </div>

        <Button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-lg shadow-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Démarrer le diagnostic →
        </Button>
      </div>
    </main>
  )
}
