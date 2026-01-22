import { cn } from '../../../../utils/cn';
import type { LanguageBreakdown } from '../../../../types/contextInspector';

interface LanguageDistributionProps {
  languages: LanguageBreakdown[];
  title?: string;
}

// Colors for language bars (cycle through if more than 5 languages)
const languageColors = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-pink-500',
];

export function LanguageDistribution({
  languages,
  title = 'Languages',
}: LanguageDistributionProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</h4>

      {/* Horizontal bar showing distribution */}
      <div className="flex h-2 rounded-full overflow-hidden bg-white/5">
        {languages.map((lang, idx) => (
          <div
            key={lang.name}
            className={cn(
              languageColors[idx % languageColors.length],
              'transition-all duration-300'
            )}
            style={{ width: `${lang.percentage}%` }}
            title={`${lang.name}: ${lang.percentage}%`}
          />
        ))}
      </div>

      {/* Language list */}
      <ul className="space-y-1">
        {languages.map((lang, idx) => (
          <li key={lang.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  languageColors[idx % languageColors.length]
                )}
              />
              <span className="text-gray-300">{lang.name}</span>
            </div>
            <span className="text-gray-400 tabular-nums">{lang.percentage}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
