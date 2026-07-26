import { useCallback, useEffect, useState } from 'react';
import { getAllCases, getTodos } from '../services/api';

/**
 * Notifications are derived on the client from data the app already fetches --
 * there is no notifications table or endpoint. That keeps this frontend-only:
 * no backend deploy, no PM2 restart.
 */

export type NotificationKind = 'court' | 'todoOverdue' | 'todoToday';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  /** Case name / todo title -- rendered as-is, may be Kurdish or Arabic. */
  title: string;
  /** The date the item is about, for display. */
  date: Date;
  /** Whole days from today. Negative means overdue. */
  daysAway: number;
  /** Where clicking the row should navigate. */
  href: string;
}

/** Court dates this many days ahead (inclusive) are worth surfacing. */
const COURT_LOOKAHEAD_DAYS = 7;

/** Midnight today, so comparisons are by calendar day rather than by clock. */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(from: Date, to: Date): number {
  const a = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  const b = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  return Math.round((a - b) / 86400000);
}

/**
 * `due_date` arrives as a plain YYYY-MM-DD string. Passing that to `new Date()`
 * parses it as UTC midnight, which lands on the previous day for anyone behind
 * UTC and would mark a todo overdue a day early. Split it and build a local date.
 */
function parseDueDate(value: string): Date | null {
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [cases, todos] = await Promise.all([getAllCases(), getTodos()]);
      const today = startOfToday();
      const items: AppNotification[] = [];

      for (const c of cases) {
        for (const cd of c.court_dates ?? []) {
          if (!cd.interview_date) continue;
          const when = new Date(cd.interview_date);
          if (Number.isNaN(when.getTime())) continue;

          const daysAway = daysBetween(today, when);
          // Past hearings are history, not something to act on.
          if (daysAway < 0 || daysAway > COURT_LOOKAHEAD_DAYS) continue;

          const who = c.applicants?.[0]?.name?.trim();
          items.push({
            id: `court-${c.id}-${cd.id ?? when.getTime()}`,
            kind: 'court',
            title: who ? `#${c.id} — ${who}` : `#${c.id} — ${c.request_type}`,
            date: when,
            daysAway,
            href: `/cases/${c.id}`,
          });
        }
      }

      for (const todo of todos) {
        if (todo.is_completed || !todo.due_date) continue;
        const due = parseDueDate(todo.due_date);
        if (!due) continue;

        const daysAway = daysBetween(today, due);
        // Only what needs attention now: overdue, or due today.
        if (daysAway > 0) continue;

        items.push({
          id: `todo-${todo.id}`,
          kind: daysAway < 0 ? 'todoOverdue' : 'todoToday',
          title: todo.title,
          date: due,
          daysAway,
          href: '/todos',
        });
      }

      // Most urgent first: furthest overdue at the top, then today, then soonest.
      items.sort((a, b) => a.daysAway - b.daysAway || a.title.localeCompare(b.title));
      setNotifications(items);
    } catch {
      // A failed poll should not blank a list the user is reading, nor surface
      // an error in the header. Keep whatever was last loaded.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { notifications, count: notifications.length, loading, reload: load };
}
