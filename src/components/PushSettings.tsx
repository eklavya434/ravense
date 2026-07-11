'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, Check, Settings, X, Loader2 } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';

// Helper to convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  // VAPID Public Key injected from env
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      checkActiveSubscription();
    }
  }, []);

  // Handle clicking outside to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkActiveSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setSubscribed(true);
        // Load saved categories from localStorage or API
        const savedCats = localStorage.getItem('ravense_subscribed_categories');
        setSelectedCats(savedCats ? JSON.parse(savedCats) : []);
      }
    } catch (e) {
      console.error('Error checking push subscription:', e);
    }
  };

  const handleSubscribe = async () => {
    if (!('serviceWorker' in navigator) || !('Notification' in window) || !vapidPublicKey) {
      alert('Push notifications are not supported on this browser.');
      return;
    }

    setLoading(true);
    try {
      // 1. Request Permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      
      if (perm !== 'granted') {
        alert('Permission for notifications was denied.');
        setLoading(false);
        return;
      }

      // 2. Register Sub with Service Worker
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // 3. Send subscription to our server
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub,
          categories: selectedCats
        })
      });

      if (res.ok) {
        setSubscribed(true);
        localStorage.setItem('ravense_subscribed_categories', JSON.stringify(selectedCats));
      } else {
        throw new Error('Failed to save subscription on server');
      }
    } catch (err) {
      console.error('Failed to subscribe:', err);
      alert('Subscription failed. Please check console logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!('serviceWorker' in navigator)) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        
        // Notify server
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint })
        });
      }
      setSubscribed(false);
      localStorage.removeItem('ravense_subscribed_categories');
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = async (catKey: string) => {
    let nextCats = [...selectedCats];
    if (nextCats.includes(catKey)) {
      nextCats = nextCats.filter(c => c !== catKey);
    } else {
      nextCats.push(catKey);
    }
    setSelectedCats(nextCats);

    // If subscribed, sync updates directly to server
    if (subscribed) {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription: sub,
              categories: nextCats
            })
          });
          localStorage.setItem('ravense_subscribed_categories', JSON.stringify(nextCats));
        }
      } catch (err) {
        console.error('Failed to update category subscriptions on server:', err);
      }
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 border rounded-full transition-colors focus:outline-none cursor-pointer flex items-center justify-center ${
          subscribed 
            ? 'border-wax/40 bg-wax/5 text-wax hover:bg-wax/10' 
            : 'border-ink/10 text-ink/70 hover:border-wax hover:text-wax hover:bg-wax/5'
        }`}
        title="Notification Settings"
        aria-label="Manage push notifications"
      >
        {subscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-paper border border-ink/20 rounded-lg shadow-xl p-5 z-50 animate-fadeIn select-none">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3 mb-4">
            <h4 className="font-serif text-sm font-bold text-ink flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-wax" /> Dispatch Alerts
            </h4>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-ink/40 hover:text-ink cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Status indicators */}
            <div className="text-xs font-sans text-ink/75 leading-relaxed">
              {permission === 'denied' ? (
                <p className="text-certainty-speculation bg-certainty-speculation/5 border border-certainty-speculation/10 p-2 rounded">
                  Notifications blocked in browser. Please reset permission in site settings.
                </p>
              ) : subscribed ? (
                <div className="space-y-3">
                  <p className="text-certainty-confirmed font-semibold">✓ Connected to Alerts Network</p>
                  
                  {/* Category checklist */}
                  <div className="border-t border-ink/5 pt-3">
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-ink/40 mb-2">
                      Alert Feed Filters (Empty = All)
                    </span>
                    <div className="space-y-2">
                      {CATEGORIES.map(cat => {
                        const checked = selectedCats.includes(cat.key);
                        return (
                          <label 
                            key={cat.key} 
                            className="flex items-center gap-2 cursor-pointer text-ink hover:text-wax transition-colors text-xs"
                          >
                            <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-all ${
                              checked ? 'border-wax bg-wax text-paper' : 'border-ink/20 bg-paper/20'
                            }`}>
                              {checked && <Check className="w-2.5 h-2.5" />}
                            </div>
                            <input 
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleCategoryToggle(cat.key)}
                              className="hidden"
                            />
                            <span>{cat.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleUnsubscribe}
                    disabled={loading}
                    className="w-full font-mono text-[10px] uppercase tracking-wider text-center py-2 border border-ink/20 rounded hover:border-certainty-speculation hover:text-certainty-speculation transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                    Disconnect Alerts
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-ink/60">
                    Get instant alerts when breaking reports are ingested from matching news channels.
                  </p>
                  <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full font-mono text-xs uppercase tracking-wider bg-ink text-paper hover:bg-wax hover:text-paper font-semibold py-2.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Enable Push Alerts
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
