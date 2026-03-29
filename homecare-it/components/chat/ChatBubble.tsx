import { sanitize } from '@/lib/sanitize'

interface Props {
  role: 'bot' | 'user'
  content: string
}

export function ChatBubble({ role, content }: Props) {
  const isBot = role === 'bot'
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isBot
            ? 'bg-[#0f1f3d] border border-slate-700/50 text-slate-300 rounded-bl-sm'
            : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm'
        }`}
      >
        {sanitize(content)}
      </div>
    </div>
  )
}
