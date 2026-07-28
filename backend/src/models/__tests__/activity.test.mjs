/**
 * Verifies the audit trail records entries and, critically, that a failure to
 * write history can never fail the operation being recorded.
 *
 *   node src/models/__tests__/activity.test.mjs
 */
import pool from '../../config/database.js';
import Activity from '../Activity.js';
import { logActivity } from '../../utils/activityLogger.js';

let failures = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) console.log(`        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const MARK = 'TESTACTOR_' + process.pid;
/** Tags rows this test writes without an actor, so cleanup can still find them. */
const SENTINEL_ID = -999999;

async function run() {
  console.log('Activity log\n');

  await Activity.record({
    actorId: null,
    actorName: MARK,
    action: 'create',
    entityType: 'case',
    entityId: 999999,
    summary: 'Test request type',
  });

  const rows = await Activity.recent(50);
  const mine = rows.filter((r) => r.actor_name === MARK);
  check('entry is written and read back', mine.length, 1);
  check('action stored', mine[0]?.action, 'create');
  check('entity stored', mine[0]?.entity_type, 'case');
  check('summary stored', mine[0]?.summary, 'Test request type');

  // Newest first, so a second entry must lead.
  await Activity.record({
    actorName: MARK, action: 'delete', entityType: 'case', entityId: 999998,
  });
  const after = (await Activity.recent(50)).filter((r) => r.actor_name === MARK);
  check('feed is newest-first', after[0]?.action, 'delete');
  check('actorId may be null', after[0]?.actor_id, null);

  // Summary longer than the column: must be truncated, not rejected.
  await Activity.record({
    actorName: MARK, action: 'create', entityType: 'file', entityId: 1,
    summary: 'x'.repeat(400),
  });
  const long = (await Activity.recent(50)).filter((r) => r.actor_name === MARK)[0];
  check('over-long summary is truncated rather than dropped', long?.summary?.length, 255);

  // The important guarantee: a bad write must not throw into the caller.
  let threw = false;
  try {
    // action is NOT NULL, so this insert fails at the database.
    await Activity.record({ actorName: MARK, action: null, entityType: 'case' });
  } catch {
    threw = true;
  }
  check('a failed write never throws at the caller', threw, false);

  // Same guarantee through the fire-and-forget helper used by controllers.
  // The no-request call records actor_name 'unknown' by design, so it is
  // tagged with SENTINEL_ID to stay findable at cleanup -- an earlier version
  // of this test matched on actor name alone and orphaned those rows.
  let helperThrew = false;
  try {
    logActivity({ user: { id: null, username: MARK } }, {
      action: null, entityType: 'case', entityId: SENTINEL_ID,
    });
    logActivity(undefined, { action: 'create', entityType: 'case', entityId: SENTINEL_ID });
  } catch {
    helperThrew = true;
  }
  check('logActivity never throws, even without a request', helperThrew, false);

  // Let the fire-and-forget inserts settle before cleaning up.
  await new Promise((r) => setTimeout(r, 400));
  const del = await pool.query(
    'DELETE FROM activity_log WHERE actor_name = $1 OR entity_id = $2', [MARK, SENTINEL_ID]);
  console.log(`\n  cleaned up ${del.rowCount} test rows`);

  const left = await pool.query(
    'SELECT count(*)::int AS n FROM activity_log WHERE actor_name = $1 OR entity_id = $2',
    [MARK, SENTINEL_ID]);
  check('no test rows left behind', left.rows[0].n, 0);

  console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
  await pool.end();
  process.exit(failures === 0 ? 0 : 1);
}

run().catch(async (err) => {
  console.error('Test crashed:', err.message);
  await pool.end();
  process.exit(1);
});
