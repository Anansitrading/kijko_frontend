import type { ChangelogEntry as ChangelogEntryType } from '../../../../types/contextInspector';
import { IngestionEntry } from './IngestionEntry';
import { EnrichmentEntry } from './EnrichmentEntry';
import { ConfigEntry } from './ConfigEntry';
import { AccessEntry } from './AccessEntry';

interface ChangelogEntryProps {
  entry: ChangelogEntryType;
  onViewDiff: (entryId: string) => void;
  onRollback: (entryNumber: number) => void;
}

export function ChangelogEntry({ entry, onViewDiff, onRollback }: ChangelogEntryProps) {
  switch (entry.type) {
    case 'ingestion':
      return (
        <IngestionEntry
          entry={entry}
          onViewDiff={() => onViewDiff(entry.id)}
          onRollback={() => entry.number && onRollback(entry.number)}
        />
      );
    case 'enrichment':
      return <EnrichmentEntry entry={entry} />;
    case 'config':
      return <ConfigEntry entry={entry} />;
    case 'access':
      return <AccessEntry entry={entry} />;
    default:
      return null;
  }
}
