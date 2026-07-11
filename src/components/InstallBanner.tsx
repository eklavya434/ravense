'use client';

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    // Check if user dismissed the prompt previously
    const dismissed = localStorage.getItem('ravense_install_dismissed');
    if (dismissed === 'true') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser prompt
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e);
      // Show our custom banner
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the browser install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // Clear prompt state and hide banner
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismissClick = () => {
    // Save dismissal in localStorage so we don't annoy the user
    localStorage.setItem('ravense_install_dismissed', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="w-full bg-wax text-paper py-3 px-4 flex items-center justify-between gap-4 font-mono text-xs shadow-md border-b border-wax-dark/10 select-none animate-fadeIn z-50">
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 shrink-0" />
        <span>Install Ravense PWA for an offline-friendly, premium mobile reading experience.</span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <button
          onClick={handleInstallClick}
          className="bg-paper text-ink hover:bg-paper/90 font-bold px-4 py-1.5 rounded transition-colors uppercase tracking-wider cursor-pointer"
        >
          Install
        </button>
        <button
          onClick={handleDismissClick}
          className="text-paper/70 hover:text-paper p-1 cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
