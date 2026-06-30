'use client';

import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { formatBytes } from '@/utils/formatBytes';
import type { DirectoryListResult, FileReadResult, OperationResult } from '@/types';

interface ToolResultCardProps {
  toolName: string;
  result: unknown;
  success: boolean;
  duration?: number;
}

export function ToolResultCard({ toolName, result, success, duration }: ToolResultCardProps) {
  const { copied, copy } = useCopyToClipboard();

  const borderColor = success ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)';
  const headerBg = success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)';
  const statusColor = success ? '#6ee7b7' : '#fca5a5';
  const statusIcon = success ? '✓' : '✗';

  return (
    <div
      className="rounded-lg border overflow-hidden text-xs animate-fadein"
      style={{ borderColor, background: 'var(--surface-2)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'var(--border)', background: headerBg }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: statusColor }}>{statusIcon}</span>
          <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
            {toolName} result
          </span>
        </div>
        {duration !== undefined && (
          <span style={{ color: 'var(--text-muted)' }}>{duration}ms</span>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        {!success ? (
          <ErrorResult result={result} />
        ) : toolName === 'list_directory' ? (
          <DirectoryResult result={result as DirectoryListResult} />
        ) : toolName === 'read_file' ? (
          <FileResult result={result as FileReadResult} onCopy={copy} copied={copied} />
        ) : (
          <OperationResultView result={result as OperationResult} />
        )}
      </div>
    </div>
  );
}

function ErrorResult({ result }: { result: unknown }) {
  const message =
    typeof result === 'string'
      ? result
      : result && typeof result === 'object' && 'error' in result
      ? String((result as { error: string }).error)
      : 'Unknown error';

  return <p style={{ color: '#fca5a5' }}>{message}</p>;
}

function DirectoryResult({ result }: { result: DirectoryListResult }) {
  if (!result?.entries) return <p style={{ color: 'var(--text-muted)' }}>Empty directory</p>;

  return (
    <div className="space-y-1">
      <p style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>
        {result.path} — {result.totalEntries} item{result.totalEntries !== 1 ? 's' : ''}
      </p>
      <div className="space-y-0.5">
        {result.entries.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between py-0.5 px-2 rounded"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="flex items-center gap-2">
              <span>{entry.type === 'directory' ? '📁' : '📄'}</span>
              <span style={{ color: entry.type === 'directory' ? '#93c5fd' : 'var(--text)' }}>
                {entry.name}
              </span>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>{formatBytes(entry.size)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FileResult({
  result,
  onCopy,
  copied,
}: {
  result: FileReadResult;
  onCopy: (text: string) => void;
  copied: boolean;
}) {
  return (
    <div className="relative group">
      <p style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>
        {result.path} — {formatBytes(result.size)}
      </p>
      <pre
        className="overflow-x-auto leading-relaxed"
        style={{
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          maxHeight: '300px',
          overflowY: 'auto',
        }}
      >
        {result.content}
      </pre>
      <button
        onClick={() => onCopy(result.content)}
        className="absolute top-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-0.5 rounded cursor-pointer"
        style={{ background: 'var(--border)', color: 'var(--text-muted)' }}
        aria-label="Copy file content"
      >
        {copied ? '✓ copied' : 'copy'}
      </button>
    </div>
  );
}

function OperationResultView({ result }: { result: OperationResult }) {
  return (
    <p style={{ color: '#6ee7b7' }}>{result?.message ?? 'Operation completed.'}</p>
  );
}
