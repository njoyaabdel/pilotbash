export function StreamingIndicator() {
  return (
    <div className="flex items-center gap-2 px-1" aria-live="polite" aria-label="AI is generating a response">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Génération en cours</span>
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block w-1 h-1 rounded-full"
            style={{
              background: 'var(--accent)',
              animation: `pulse-soft 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </span>
    </div>
  );
}
