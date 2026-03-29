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
      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Choisissez une réponse</p>
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
