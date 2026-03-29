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
