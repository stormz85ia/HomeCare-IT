import { Card } from '@/components/ui/card'

export function TwintQR() {
  return (
    <Card className="bg-[#0f1f3d] border border-blue-700/30 rounded-2xl p-5 flex flex-col items-center gap-4 text-center">
      <h3 className="text-sm font-semibold text-slate-200">💳 Payer par TWINT</h3>
      <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center p-3">
        <div className="w-full h-full opacity-20 grid grid-cols-8 gap-px">
          {Array.from({ length: 64 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-sm ${(i * 7 + i) % 3 === 0 ? 'bg-black' : 'bg-transparent'}`}
            />
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-400">
        Scannez avec TWINT pour régler <span className="font-semibold text-slate-200">89 CHF</span>
      </p>
      <p className="text-[10px] text-slate-600">QR code définitif transmis lors de la confirmation de rendez-vous.</p>
    </Card>
  )
}
