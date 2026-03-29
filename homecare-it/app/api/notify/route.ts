import { z } from 'zod'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

const NotifySchema = z.object({
  technology: z.enum(['fibre_oto', 'vdsl', 'cable']),
  fai: z.enum(['swisscom', 'salt', 'sunrise', 'netplus', 'autre']),
  summary: z.string().min(1).max(2000),
  paymentMethod: z.enum(['twint', 'on_site', 'on_site_no_pack']),
})

const FAI_LABELS: Record<string, string> = { swisscom: 'Swisscom', salt: 'Salt', sunrise: 'Sunrise', netplus: 'Net+', autre: 'Autre' }
const TECH_LABELS: Record<string, string> = { fibre_oto: 'Fibre OTO', vdsl: 'VDSL', cable: 'Câble' }
const PAY_LABELS: Record<string, string> = { twint: 'TWINT', on_site: 'Sur place (Pack VIP)', on_site_no_pack: 'Sur place (sans pack)' }

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = NotifySchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })

  const { technology, fai, summary, paymentMethod } = result.data
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (token && chatId) {
    const text = [
      "🔔 *Nouvelle demande d'intervention HomeCare IT*",
      '',
      `👤 Opérateur : ${FAI_LABELS[fai]} | Technologie : ${TECH_LABELS[technology]}`,
      `💳 Paiement : ${PAY_LABELS[paymentMethod]}`,
      `📋 Parcours : ${summary}`,
    ].join('\n')

    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
      })
    } catch { /* non-blocking */ }
  }

  return NextResponse.json({ success: true })
}
