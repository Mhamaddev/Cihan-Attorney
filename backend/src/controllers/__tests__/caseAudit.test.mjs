/**
 * Verifies the controllers actually write the audit entries the admin feed
 * expects -- the wiring, not the model. A logActivity call with the wrong
 * entity_type renders as raw debug text in the UI and nothing else complains.
 *
 *   node src/controllers/__tests__/caseAudit.test.mjs
 */
import pool from '../../config/database.js';
import Case from '../../models/Case.js';
import {
  createCase, updateCase, deleteCase, addCourtDate, addExpense,
} from '../caseController.js';

let failures = 0;

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) console.log(`        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const ACTOR = 'AUDITTEST_' + process.pid;

/** Minimal express double: captures status and body. */
function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}
const mockReq = (params = {}, body = {}) => ({
  params, body, user: { id: null, username: ACTOR },
});

const settle = () => new Promise((r) => setTimeout(r, 300));

async function entriesForActor() {
  const { rows } = await pool.query(
    `SELECT action, entity_type, entity_id, summary FROM activity_log
      WHERE actor_name = $1 ORDER BY id ASC`, [ACTOR]);
  return rows;
}

async function run() {
  console.log('Case controller audit wiring\n');
  let caseId;

  try {
    // create
    let res = mockRes();
    await createCase(mockReq({}, {
      request_type: 'AUDIT_TEST_TYPE',
      is_called_for_court: false,
      applicant: { name: 'A', phone_number: '1', address: 'x' },
      wanted: { name: 'W', phone_number: '2', address: 'y' },
    }), res);
    check('create returns 201', res.statusCode, 201);
    caseId = res.body.id;

    // update
    res = mockRes();
    await updateCase(mockReq({ id: String(caseId) }, {
      request_type: 'AUDIT_TEST_UPDATED',
      is_called_for_court: true,
      status: 'pending',
    }), res);
    check('update returns 200', res.statusCode, 200);

    // court date + expense
    await addCourtDate(mockReq({ id: String(caseId) },
      { interview_date: new Date().toISOString(), notes: 'n' }), mockRes());
    await addExpense(mockReq({ id: String(caseId) },
      { expense_name: 'Filing fee', amount: '25000', expense_date: '2026-07-28', note: '' }), mockRes());

    await settle();
    const rows = await entriesForActor();

    check('four entries recorded so far', rows.length, 4);
    check('case create logged',
      rows[0], { action: 'create', entity_type: 'case', entity_id: caseId, summary: 'AUDIT_TEST_TYPE' });
    check('case update logged',
      rows[1], { action: 'update', entity_type: 'case', entity_id: caseId, summary: 'AUDIT_TEST_UPDATED' });
    check('court date logged against its case',
      { a: rows[2].action, e: rows[2].entity_type, id: rows[2].entity_id },
      { a: 'create', e: 'court_date', id: caseId });
    check('expense logged with a readable summary',
      { a: rows[3].action, e: rows[3].entity_type, s: rows[3].summary },
      { a: 'create', e: 'expense', s: 'Filing fee 25000' });

    // delete -- must capture the name before the row disappears
    res = mockRes();
    await deleteCase(mockReq({ id: String(caseId) }), res);
    check('delete returns 200', res.statusCode, 200);
    caseId = null;

    await settle();
    const afterDelete = await entriesForActor();
    const del = afterDelete[afterDelete.length - 1];
    check('delete logged with the name it had',
      { a: del.action, e: del.entity_type, s: del.summary },
      { a: 'delete', e: 'case', s: 'AUDIT_TEST_UPDATED' });

    // The audit row must outlive the case it describes.
    const stillThere = await pool.query(
      'SELECT count(*)::int AS n FROM activity_log WHERE actor_name = $1', [ACTOR]);
    check('audit survives deletion of the case it refers to', stillThere.rows[0].n, 5);
  } finally {
    if (caseId) await Case.delete(caseId).catch(() => {});
    const del = await pool.query('DELETE FROM activity_log WHERE actor_name = $1', [ACTOR]);
    console.log(`\n  cleaned up ${del.rowCount} audit rows`);
  }

  console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
  await pool.end();
  process.exit(failures === 0 ? 0 : 1);
}

run().catch(async (err) => {
  console.error('Test crashed:', err.message);
  await pool.end();
  process.exit(1);
});
