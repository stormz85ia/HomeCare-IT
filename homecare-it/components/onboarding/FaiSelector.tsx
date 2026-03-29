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
