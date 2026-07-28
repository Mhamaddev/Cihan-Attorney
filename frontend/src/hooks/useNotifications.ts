import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAllCases, getTodos } from '../services/api';
import { deriveNotifications, badgeCount } from './notificationRules';
import type { NotificationSeed } from './notificationRules';

export type { NotificationKind, NotificationSeed } from './notificationRules';
export { isUrgent } from './notificationRules';

/**
 * Notifications are derived on the client from data the app already fetches --
 * there is no notifications table or endpoint. The two list calls are
 * request-coalesced in the api layer, so mounting alongside a page that wants
 * the same data costs one request rather than two.
 *
 * The rules themselves live in ./notificationRules so they stay testable.
 */

export interface AppNotification extends NotificationSeed {
  /** Not yet acknowledged by opening the bell. */
  isNew: boolean;
}

/** Re-derive this often so a tab left open does not go stale. */
const POLL_INTERVAL_MS = 5 * 60 * 1000;

const SEEN_STORAGE_KEY = 'seenNotifications';

function readSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    // Corrupt or unavailable storage must not take the header down.
    return [];
  }
}

function writeSeen(ids: string[]) {
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Private browsing and quota errors are not worth surfacing here.
  }
}

export function useNotifications() {
  const [items, setItems] = useState<NotificationSeed[]>([]);
  const [seen, setSeen] = useState<string[]>(readSeen);
  const [loading, setLoading] = useState(true);
  // Avoids a setState on an unmounted component if a poll lands after teardown.
  const alive = useRef(true);
  // markAllSeen is invoked right after a reload is kicked off, so reading
  // `items` from its closure would acknowledge the pre-refresh list.
  const latestItems = useRef<NotificationSeed[]>([]);

  const load = useCallback(async () => {
    try {
      const [cases, todos] = await Promise.all([getAllCases(), getTodos()]);
      if (!alive.current) return;

      const next = deriveNotifications(cases, todos);
      latestItems.current = next;
      setItems(next);

      // Forget acknowledgements for things that no longer exist, otherwise the
      // stored list grows without bound across every case ever opened.
      setSeen((prev) => {
        const live = new Set(next.map((n) => n.id));
        const pruned = prev.filter((id) => live.has(id));
        if (pruned.length === prev.length) return prev;
        writeSeen(pruned);
        return pruned;
      });
    } catch {
      // A failed poll should not blank a list the user is reading, nor surface
      // an error in the header. Keep whatever was last loaded.
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    load();

    // Skip work while the tab is hidden, and refresh on return, so coming back
    // to a tab left open overnight shows today rather than yesterday.
    const tick = () => {
      if (document.visibilityState === 'visible') load();
    };
    const timer = setInterval(tick, POLL_INTERVAL_MS);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);

    return () => {
      alive.current = false;
      clearInterval(timer);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [load]);

  const notifications = useMemo<AppNotification[]>(() => {
    const seenSet = new Set(seen);
    return items.map((n) => ({ ...n, isNew: !seenSet.has(n.id) }));
  }, [items, seen]);

  const count = useMemo(() => badgeCount(items, new Set(seen)), [items, seen]);

  /** Called when the panel opens: everything on screen has now been seen. */
  const markAllSeen = useCallback(() => {
    setSeen((prev) => {
      const merged = Array.from(new Set([...prev, ...latestItems.current.map((n) => n.id)]));
      writeSeen(merged);
      return merged;
    });
  }, []);

  return { notifications, count, loading, reload: load, markAllSeen };
}
