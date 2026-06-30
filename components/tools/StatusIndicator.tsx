import { Spinner } from '@/components/ui/Spinner';

type Phase = 'analysing' | 'calling' | 'executing';

interface StatusIndicatorProps {
  phase: Phase;
  toolName?: string;
}

const PHASE_LABELS: Record<Phase, string> = {
  analysing: 'Analyse de votre demande…',
  calling: 'Sélection du tool…',
  executing: 'Exécution…',
};

export function StatusIndicator({ phase, toolName }: StatusIndicatorProps) {
  const label =
    phase === 'calling' && toolName
      ? `Tool utilisé : ${toolName}`
      : PHASE_LABELS[phase];

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
      style={{
        background: 'var(--accent-dim)',
        color: 'var(--accent-hover)',
        border: '1px solid rgba(99,102,241,0.2)',
      }}
      aria-live="polite"
    >
      <Spinner size="sm" />
      <span>{label}</span>
    </div>
  );
}
