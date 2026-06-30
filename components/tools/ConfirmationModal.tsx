'use client';

interface ConfirmationModalProps {
  path: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({ path, onConfirm, onCancel }: ConfirmationModalProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="rounded-xl border p-6 w-full max-w-sm mx-4 shadow-2xl"
        style={{ background: 'var(--surface)', borderColor: 'rgba(239,68,68,0.3)' }}
      >
        <div className="text-2xl mb-3">🗑️</div>
        <h2 id="confirm-title" className="text-base font-semibold mb-2" style={{ color: 'var(--text)' }}>
          Supprimer ce fichier ?
        </h2>
        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
          Cette action est irréversible.
        </p>
        <code
          className="block text-xs px-3 py-2 rounded my-3 break-all"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5', fontFamily: 'var(--font-mono)' }}
        >
          {path}
        </code>
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg text-sm border cursor-pointer transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
            style={{ background: '#ef4444', color: 'white' }}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
