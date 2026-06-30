'use client';

import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

const TOOL_ICONS: Record<string, string> = {
  list_directory: '📁',
  current_directory: '📍',
  read_file: '📄',
  create_file: '✏️',
  create_directory: '📂',
  move_file: '🚚',
  rename_file: '✏️',
  delete_file: '🗑️',
};

interface ToolCallCardProps {
  toolName: string;
  args: Record<string, unknown>;
}

export function ToolCallCard({ toolName, args }: ToolCallCardProps) {
  const { copied, copy } = useCopyToClipboard();
  const icon = TOOL_ICONS[toolName] ?? '🔧';
  const argsJson = JSON.stringify(args, null, 2);

  return (
    <div
      className="rounded-lg border overflow-hidden text-xs animate-fadein"
      style={{ borderColor: 'rgba(99,102,241,0.25)', background: 'var(--surface-2)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--accent-dim)' }}
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-mono font-semibold" style={{ color: 'var(--accent-hover)' }}>
            {toolName}
          </span>
        </div>
        <span
          className="px-2 py-0.5 rounded text-xs"
          style={{ background: 'rgba(99,102,241,0.2)', color: 'var(--accent-hover)' }}
        >
          tool call
        </span>
      </div>

      {/* Args */}
      {Object.keys(args).length > 0 && (
        <div className="relative group">
          <pre
            className="px-3 py-2 overflow-x-auto text-xs leading-relaxed"
            style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
          >
            {argsJson}
          </pre>
          <button
            onClick={() => copy(argsJson)}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-0.5 rounded cursor-pointer"
            style={{ background: 'var(--border)', color: 'var(--text-muted)' }}
            aria-label="Copy arguments"
          >
            {copied ? '✓' : 'copy'}
          </button>
        </div>
      )}
    </div>
  );
}
