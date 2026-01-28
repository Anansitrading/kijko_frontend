// YAML Formatter Preview Component
// Shows live YAML preview of the skill being built

import { Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import { cn } from '../../../utils/cn';
import { draftToYaml } from '../../../lib/yamlUtils';
import type { SkillDraft } from '../../../types/skillDraft';

interface YamlPreviewProps {
  draft: SkillDraft;
  className?: string;
}

export function YamlPreview({ draft, className }: YamlPreviewProps) {
  const [copied, setCopied] = useState(false);

  const yamlContent = draftToYaml(draft);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(yamlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [yamlContent]);

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-card border border-destructive/30 rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50">
        <h3 className="text-sm font-medium text-foreground">
          YAML Formatter Preview
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
            Read-only
          </span>
          <button
            onClick={handleCopy}
            className={cn(
              'p-1.5 rounded transition-colors',
              copied
                ? 'text-green-500 bg-green-500/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            title={copied ? 'Copied!' : 'Copy YAML'}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* YAML Content */}
      <div className="flex-1 overflow-auto p-4 bg-muted/30">
        <pre className="text-sm font-mono text-foreground whitespace-pre-wrap">
          {yamlContent.split('\n').map((line, i) => (
            <div key={i} className="flex">
              <span className="w-8 text-right pr-4 text-muted-foreground select-none">
                {i + 1}
              </span>
              <span className={getYamlLineClass(line)}>{line || ' '}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

/**
 * Get syntax highlighting class for a YAML line
 */
function getYamlLineClass(line: string): string {
  // Document markers
  if (line === '---') {
    return 'text-primary';
  }

  // Keys
  if (line.match(/^\s*[\w-]+:/)) {
    return 'text-green-500';
  }

  // Array items
  if (line.match(/^\s*-\s/)) {
    return 'text-amber-500';
  }

  // Strings with quotes
  if (line.match(/['"].*['"]/)) {
    return 'text-blue-400';
  }

  // Comments
  if (line.match(/^\s*#/)) {
    return 'text-muted-foreground';
  }

  return 'text-foreground';
}
