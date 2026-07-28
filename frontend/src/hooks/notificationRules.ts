import type { Case, Todo } from '../types';

/**
 * Pure notification rules, deliberately free of React and of the API layer.
 *
 * Kept separate from `useNotifications` so the date-boundary behaviour can be
 * exercised directly by a plain node script -- these are calendar comparisons
 * with off-by-one hazards that no amount of looking at the UI would reveal.
 */

export type NotificationKind = 'court' | 'courtPassed' | 'todoOverdue' | 'todoToday';

export interface NotificationSeed {
  id: string;
  kind: NotificationKind;
  /** Case name / todo title -- rendered as-is, may be Kurdish or Arabic. */
  title: string;
  /** The date the item is about, for display. */
  date: Date;
  /** Whole days from today. Negative means it has passed. */
  daysAway: number;
  /** Where clicking the row should navigate. */
  href: string;
}

/** Hearings this many days ahead are worth surfacing. */
export const COURT_LOOKAHEAD_DAYS = 7;

/**
 * Hearings this many days *behind* stay visible. A date that has just passed
 * is the one most worth noticing -- dropping it at midnight would make a
 * missed hearing disappear overnight.
 */
export const COURT_LOOKBEHIND_DAYS = 3;

/** Compares by calendar day rather than by clock time. */
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
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * An overdue task keeps counting even after it has been seen -- it is real
 * work still outstanding, and letting it stop nagging is how a deadline slips.
 * Everything else, a passed hearing included, counts only until acknowledged:
 * a hearing that has already happened is an alert, not a debt.
 */
function alwaysCounts(kind: NotificationKind): boolean {
  return kind === 'todoOverdue';
}

/** Anything due, overdue, or happening within a day needs acting on now. */
export function isUrgent(n: { daysAway: number }): boolean {
  return n.daysAway <= 1;
}

/**
 * Turns raw cases and todos into the notification list. `now` is a parameter
 * rather than read from the clock so tests can pin the date.
 */
export function deriveNotifications(
  cases: Case[],
  todos: Todo[],
  now: Date = new Date()
): NotificationSeed[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out: NotificationSeed[] = [];

  for (const c of cases) {
    for (const cd of c.court_dates ?? []) {
      if (!cd.interview_date) continue;
      const when = new Date(cd.interview_date);
      if (Number.isNaN(when.getTime())) continue;

      const daysAway = daysBetween(today, when);
      if (daysAway < -COURT_LOOKBEHIND_DAYS || daysAway > COURT_LOOKAHEAD_DAYS) continue;

      const who = c.applicants?.[0]?.name?.trim();
      out.push({
        id: `court-${c.id}-${cd.id ?? when.getTime()}`,
        kind: daysAway < 0 ? 'courtPassed' : 'court',
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

    out.push({
      id: `todo-${todo.id}`,
      kind: daysAway < 0 ? 'todoOverdue' : 'todoToday',
      title: todo.title,
      date: due,
      daysAway,
      href: '/todos',
    });
  }

  // Most urgent first: furthest overdue at the top, then today, then soonest.
  out.sort((a, b) => a.daysAway - b.daysAway || a.title.localeCompare(b.title));
  return out;
}

/** What the badge should show, given which ids have been acknowledged. */
export function badgeCount(seeds: NotificationSeed[], seen: Set<string>): number {
  return seeds.filter((n) => !seen.has(n.id) || alwaysCounts(n.kind)).length;
}
