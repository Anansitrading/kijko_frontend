import React, { useState, useEffect } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';
import { useAutoSave } from '../../../hooks/useAutoSave';
import { getGravatarUrl, hasGravatar } from '../../../lib/gravatar';
import { tw } from '../../../styles/settings';
import SettingsRow from '../SettingsRow';

export function GravatarToggle() {
  const { getSetting } = useSettings();
  const { save } = useAutoSave();

  const email = getSetting('profile.email', '') as string;
  const useGravatar = getSetting('profile.useGravatar', false) as boolean;

  const [isChecking, setIsChecking] = useState(false);
  const [gravatarExists, setGravatarExists] = useState<boolean | null>(null);
  const [gravatarUrl, setGravatarUrl] = useState<string>('');

  // Check for Gravatar when email changes
  useEffect(() => {
    if (!email) {
      setGravatarExists(false);
      return;
    }

    setIsChecking(true);

    const checkGravatar = async () => {
      try {
        const exists = await hasGravatar(email);
        setGravatarExists(exists);

        if (exists) {
          const url = await getGravatarUrl(email, 80, 'mp');
          setGravatarUrl(url);
        }
      } catch {
        setGravatarExists(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkGravatar();
  }, [email]);

  const handleToggle = () => {
    const newValue = !useGravatar;
    save('profile.useGravatar', newValue, true);
  };

  return (
    <SettingsRow
      label="Use Gravatar"
      description="Use your Gravatar image based on your email address"
    >
      <div className="flex items-center gap-4">
        {/* Gravatar Preview */}
        {isChecking ? (
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        ) : gravatarExists && gravatarUrl ? (
          <img
            src={gravatarUrl}
            alt="Gravatar"
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
            <span className="text-xs text-gray-500">N/A</span>
          </div>
        )}

        {/* Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={useGravatar}
          aria-label="Use Gravatar"
          disabled={!gravatarExists || isChecking}
          onClick={handleToggle}
          className={`${useGravatar && gravatarExists ? tw.toggleActive : tw.toggle} ${
            !gravatarExists || isChecking ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span
            className={useGravatar && gravatarExists ? tw.toggleKnobActive : tw.toggleKnob}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Status Message */}
      <div className="mt-2">
        {!email && (
          <p className="text-xs text-gray-500">Enter your email to check for Gravatar</p>
        )}
        {email && !isChecking && !gravatarExists && (
          <p className="text-xs text-gray-500">
            No Gravatar found.{' '}
            <a
              href="https://gravatar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
            >
              Create one
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        )}
        {gravatarExists && useGravatar && (
          <p className="text-xs text-green-400">Using Gravatar</p>
        )}
      </div>
    </SettingsRow>
  );
}

export default GravatarToggle;
