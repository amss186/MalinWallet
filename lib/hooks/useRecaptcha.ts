'use client';

import { useState, useEffect, useCallback } from 'react';

export const useRecaptcha = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      setIsReady(true);
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const verify = useCallback(async () => {
    if (!isReady || !(window as any).grecaptcha) return false;

    try {
      const token = await (window as any).grecaptcha.execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, { action: 'submit' });

      // Verify with our API route
      const response = await fetch('/api/recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();
      return data.success;
    } catch (e) {
      console.error("Recaptcha error", e);
      return false;
    }
  }, [isReady]);

  return { verify, isReady };
};
