import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CONSENT_KEY = 'kijko-cookie-consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-card border border-border rounded-xl p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm text-foreground font-medium mb-1">
            Privacy &amp; Cookies
          </p>
          <p className="text-xs text-muted-foreground">
            Kijko gebruikt geen tracking cookies. Wij gebruiken alleen functionele
            sessiecookies voor authenticatie en Cloudflare Web Analytics (cookieloos).{' '}
            <a
              href="/privacy-policy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Privacybeleid
            </a>
          </p>
        </div>
        <button
          onClick={accept}
          className="shrink-0 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Begrepen
        </button>
        <button
          onClick={accept}
          className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Sluiten"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
