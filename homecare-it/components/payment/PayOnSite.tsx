import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function PayOnSite() {
  return (
    <Card className="bg-[#0f1f3d] border border-green-700/30 rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
      <div className="text-3xl">🏠</div>
      <Badge className="bg-green-600/20 text-green-400 border border-green-700/40 text-[10px] uppercase tracking-widest">
        ✓ Statut VIP pré-activé
      </Badge>
      <p className="text-sm text-slate-300 leading-relaxed">
        Parfait ! Le technicien vous contactera pour convenir d&apos;un rendez-vous. Il encaissera la somme à son arrivée.
      </p>
      <p className="text-xs text-slate-500">Secteur d&apos;intervention : Oron et environs</p>
    </Card>
  )
}
