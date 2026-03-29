import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
  process.env.TELEGRAM_BOT_TOKEN = 'test_token'
  process.env.TELEGRAM_CHAT_ID = '123456'
})

describe('POST /api/notify', () => {
  it('returns 400 for missing fields', async () => {
    const { POST } = await import('../route')
    const req = new Request('http://localhost/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technology: 'vdsl' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 and calls Telegram with valid payload', async () => {
    const { POST } = await import('../route')
    const req = new Request('http://localhost/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technology: 'vdsl', fai: 'swisscom', summary: 'Test → Oui', paymentMethod: 'twint' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('api.telegram.org'), expect.any(Object))
  })

  it('returns 200 even if Telegram API fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const { POST } = await import('../route')
    const req = new Request('http://localhost/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technology: 'vdsl', fai: 'swisscom', summary: 'test', paymentMethod: 'on_site' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })
})
