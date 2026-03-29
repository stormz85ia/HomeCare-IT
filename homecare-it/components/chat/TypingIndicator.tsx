export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-[#0f1f3d] border border-slate-700/50 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
