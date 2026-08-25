export function TypingDots() {
  return (
    <div className="flex gap-1 py-1" aria-label="AAVA is thinking">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full"
          style={{
            background: 'var(--muted)',
            animation: 'typing 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.16}s`,
          }} />
      ))}
      <style>{`@keyframes typing { 0%,60%,100% { opacity:.25 } 30% { opacity:1 } }`}</style>
    </div>
  )
}
