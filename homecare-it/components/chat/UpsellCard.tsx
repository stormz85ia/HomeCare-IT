import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface Props {
  onActivate: () => void
  onSkip: () => void
}

const FEATURES = ['Support N1 illimité', 'Déplacement offert', 'Tarif horaire VIP 70 CHF/h']

export function UpsellCard({ onActivate, onSkip }: Props) {
  return (
    <Card className="bg-gradient-to-br from-[#0f1f3d] to-[#0a1628] border border-blue-700/40 rounded-2xl p-4 shadow-xl shadow-blue-950/50">
      <Badge className="mb-3 bg-blue-600/20 text-blue-300 border border-blue-700/40 text-[10px] uppercase tracking-widest">
        ⭐ Offre recommandée
      </Badge>
      <h3 className="text-base font-bold text-slate-100 mb-1">Pack Annuel Tranquillité</h3>
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
      <p className="text-[10px] text-slate-600 line-through mb-4">Sans pack : 120 CHF/h + frais de déplacement</p>
      <Button
        onClick={onActivate}
        className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
      >
        Activer le Pack VIP à 89 CHF →
      </Button>
      <Separator className="my-3 bg-slate-800" />
      <button
        onClick={onSkip}
        className="w-full text-[11px] text-slate-500 hover:text-slate-400 underline underline-offset-2"
      >
        Réserver une intervention sans pack (120 CHF/h)
      </button>
    </Card>
  )
}
