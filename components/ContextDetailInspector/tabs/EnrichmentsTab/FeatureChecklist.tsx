import { Check, X } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface Feature {
  name: string;
  enabled: boolean;
  status?: string;
}

interface FeatureChecklistProps {
  features: Feature[];
  title?: string;
}

export function FeatureChecklist({ features, title = 'Features' }: FeatureChecklistProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</h4>
      <ul className="space-y-1.5">
        {features.map((feature) => (
          <li key={feature.name} className="flex items-center gap-2">
            {feature.enabled ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-4 h-4 text-gray-500 shrink-0" />
            )}
            <span
              className={cn(
                'text-sm',
                feature.enabled ? 'text-gray-200' : 'text-gray-500'
              )}
            >
              {feature.name}
              {feature.status && (
                <span className="text-gray-400 ml-1">: {feature.status}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
