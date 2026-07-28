/**
 * Tests for notification derivation and the badge rule.
 *
 * The date handling here has real edge cases -- calendar-day boundaries, a
 * YYYY-MM-DD string that must not be parsed as UTC, and a window that reaches
 * both backwards and forwards -- none of which are visible by looking at the UI.
 *
 * Run:  node --experimental-strip-types src/hooks/__tests__/notifications.test.mjs
 *   or: npm run test:notifications
 */
import { deriveNotifications, badgeCount, isUrgent } from '../notificationRules.ts';

let failures = 0;

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) console.log(`        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

/** Local-time date, matching how the app builds dates from user input. */
const at = (y, m, d, hh = 0, mm = 0) => new Date(y, m - 1, d, hh, mm);
const NOW = at(2026, 7, 28, 14, 30); // a Tuesday afternoon

const caseWith = (id, dates) => ({
  id,
  request_type: 'Civil',
  applicants: [{ name: 'Applicant ' + id }],
  court_dates: dates,
});

console.log('deriveNotifications\n');

// --- Court date window --------------------------------------------------
{
  const cases = [
    caseWith(1, [{ id: 1, interview_date: at(2026, 7, 28, 9, 0).toISOString() }]),  // today
    caseWith(2, [{ id: 2, interview_date: at(2026, 7, 29, 9, 0).toISOString() }]),  // tomorrow
    caseWith(3, [{ id: 3, interview_date: at(2026, 8, 4, 9, 0).toISOString() }]),   // +7 edge
    caseWith(4, [{ id: 4, interview_date: at(2026, 8, 5, 9, 0).toISOString() }]),   // +8 out
    caseWith(5, [{ id: 5, interview_date: at(2026, 7, 27, 9, 0).toISOString() }]),  // yesterday
    caseWith(6, [{ id: 6, interview_date: at(2026, 7, 25, 9, 0).toISOString() }]),  // -3 edge
    caseWith(7, [{ id: 7, interview_date: at(2026, 7, 24, 9, 0).toISOString() }]),  // -4 out
  ];
  const got = deriveNotifications(cases, [], NOW);
  const ids = got.map((n) => n.id);

  check('includes today', ids.includes('court-1-1'), true);
  check('includes +7 boundary', ids.includes('court-3-3'), true);
  check('excludes +8', ids.includes('court-4-4'), false);
  check('includes yesterday', ids.includes('court-5-5'), true);
  check('includes -3 boundary', ids.includes('court-6-6'), true);
  check('excludes -4', ids.includes('court-7-7'), false);

  const yesterday = got.find((n) => n.id === 'court-5-5');
  check('past hearing is kind courtPassed', yesterday.kind, 'courtPassed');
  check('past hearing daysAway is -1', yesterday.daysAway, -1);

  const today = got.find((n) => n.id === 'court-1-1');
  check('a hearing earlier today still counts as today', today.daysAway, 0);
  check('today hearing is kind court', today.kind, 'court');
}

// --- Todo due dates -----------------------------------------------------
console.log('\ntodo handling\n');
{
  const todos = [
    { id: 1, title: 'Overdue task', due_date: '2026-07-25', is_completed: false },
    { id: 2, title: 'Due today', due_date: '2026-07-28', is_completed: false },
    { id: 3, title: 'Due tomorrow', due_date: '2026-07-29', is_completed: false },
    { id: 4, title: 'Done already', due_date: '2026-07-20', is_completed: true },
    { id: 5, title: 'No due date', due_date: null, is_completed: false },
  ];
  const got = deriveNotifications([], todos, NOW);
  const ids = got.map((n) => n.id);

  check('overdue todo included', ids.includes('todo-1'), true);
  check('todo due today included', ids.includes('todo-2'), true);
  check('future todo excluded', ids.includes('todo-3'), false);
  check('completed todo excluded', ids.includes('todo-4'), false);
  check('todo without due date excluded', ids.includes('todo-5'), false);

  check('overdue kind', got.find((n) => n.id === 'todo-1').kind, 'todoOverdue');
  check('due-today kind', got.find((n) => n.id === 'todo-2').kind, 'todoToday');

  // The regression that motivated parseDueDate: "2026-07-28" through
  // new Date() is UTC midnight, which is 27 Jul locally anywhere behind UTC
  // and would report the task as already a day late.
  check('YYYY-MM-DD is read as a local day, not UTC',
    got.find((n) => n.id === 'todo-2').daysAway, 0);
}

// --- Ordering and grouping ---------------------------------------------
console.log('\nordering\n');
{
  const cases = [caseWith(9, [{ id: 9, interview_date: at(2026, 8, 2, 9, 0).toISOString() }])];
  const todos = [
    { id: 1, title: 'Three days late', due_date: '2026-07-25', is_completed: false },
    { id: 2, title: 'Due today', due_date: '2026-07-28', is_completed: false },
  ];
  const got = deriveNotifications(cases, todos, NOW);
  check('most overdue first', got.map((n) => n.id), ['todo-1', 'todo-2', 'court-9-9']);
  check('overdue is urgent', isUrgent(got[0]), true);
  check('hearing in 5 days is not urgent', isUrgent(got[2]), false);
}

// --- Badge rule ---------------------------------------------------------
console.log('\nbadge rule: unseen + still-overdue\n');
{
  const todos = [
    { id: 1, title: 'Overdue', due_date: '2026-07-25', is_completed: false },
    { id: 2, title: 'Due today', due_date: '2026-07-28', is_completed: false },
  ];
  const cases = [caseWith(9, [{ id: 9, interview_date: at(2026, 8, 1, 9, 0).toISOString() }])];
  const seeds = deriveNotifications(cases, todos, NOW);

  check('nothing seen -> everything counts', badgeCount(seeds, new Set()), 3);
  check('all seen -> only the overdue task still counts',
    badgeCount(seeds, new Set(seeds.map((n) => n.id))), 1);
  check('seeing only the hearing leaves the two tasks',
    badgeCount(seeds, new Set(['court-9-9'])), 2);

  // A passed hearing is an alert, not outstanding work, so it stops counting
  // once acknowledged -- unlike an overdue task.
  const passed = deriveNotifications(
    [caseWith(8, [{ id: 8, interview_date: at(2026, 7, 27, 9, 0).toISOString() }])], [], NOW);
  check('acknowledged passed hearing stops counting',
    badgeCount(passed, new Set(['court-8-8'])), 0);

  // Completing the task is what clears it.
  const completed = deriveNotifications(cases,
    [{ id: 1, title: 'Overdue', due_date: '2026-07-25', is_completed: true }], NOW);
  check('completing the overdue task clears it',
    badgeCount(completed, new Set(completed.map((n) => n.id))), 0);
}

// --- Malformed input ----------------------------------------------------
console.log('\nmalformed input\n');
{
  const cases = [
    { id: 1, request_type: 'X', court_dates: [{ id: 1, interview_date: 'not-a-date' }] },
    { id: 2, request_type: 'Y', court_dates: null },
    { id: 3, request_type: 'Z' },
  ];
  const todos = [{ id: 1, title: 'Bad date', due_date: 'garbage', is_completed: false }];
  const got = deriveNotifications(cases, todos, NOW);
  check('unparseable dates are dropped rather than crashing', got.length, 0);
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
