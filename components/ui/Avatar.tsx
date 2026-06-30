interface AvatarProps {
  role: 'user' | 'assistant';
}

export function Avatar({ role }: AvatarProps) {
  if (role === 'assistant') {
    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
        style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}
        aria-label="AI Assistant"
      >
        AI
      </div>
    );
  }

  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
      style={{ background: 'var(--border)' }}
      aria-label="User"
    >
      U
    </div>
  );
}
