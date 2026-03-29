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
      <Label htmlFor="consent" className="text-xs text-slate-400 leading-relaxed cursor-pointer">
        J&apos;accepte le traitement local de mes données pour le diagnostic (LPD/RGPD — aucune donnée transmise sans mon consentement)
      </Label>
    </div>
  )
}
