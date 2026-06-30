'use client';

import { useRef, type ChangeEvent, type FormEvent, useEffect } from 'react';
import { Spinner } from '@/components/ui/Spinner';

interface InputBarProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onStop: () => void;
}

export function InputBar({ value, onChange, onSubmit, isLoading, onStop }: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        const form = e.currentTarget.closest('form');
        form?.requestSubmit();
      }
    }
  }

  return (
    <div
      className="border-t px-4 py-4"
      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
    >
      <form onSubmit={onSubmit} className="flex items-end gap-3">
        <div
          className="flex-1 flex items-end gap-2 rounded-xl border px-4 py-3 transition-colors"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder="Dites-moi ce que vous voulez faire…"
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed"
            style={{
              color: 'var(--text)',
              caretColor: 'var(--accent)',
              maxHeight: '200px',
            }}
            aria-label="Message input"
          />
          {value.length > 0 && (
            <span className="text-xs mb-0.5 shrink-0" style={{ color: 'var(--text-muted)' }}>
              {value.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border cursor-pointer transition-colors"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            aria-label="Stop generation"
          >
            <span className="w-3 h-3 rounded-sm" style={{ background: 'var(--text-muted)' }} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!value.trim()}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent)' }}
            aria-label="Send message (⌘+Enter)"
          >
            {isLoading ? (
              <Spinner />
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 8L2 2l2 6-2 6 12-6z" fill="white" />
              </svg>
            )}
          </button>
        )}
      </form>

      <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
        ⌘+Entrée pour envoyer · Actions exécutées localement sur votre machine
      </p>
    </div>
  );
}
