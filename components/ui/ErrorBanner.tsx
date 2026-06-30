'use client';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 px-4 py-3 rounded-lg border text-sm"
      style={{
        background: 'rgba(239, 68, 68, 0.08)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
        color: '#fca5a5',
      }}
    >
      <span className="text-base leading-none mt-0.5">⚠</span>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-xs opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
}
