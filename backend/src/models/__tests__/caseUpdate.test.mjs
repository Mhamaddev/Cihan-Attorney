/**
 * Regression test: editing a case must persist applicant and defendant edits.
 *
 * Case.update originally destructured only request_type, is_called_for_court
 * and status, so every change to the two parties was silently dropped -- the
 * request returned 200 and the edit simply vanished.
 *
 * Run against a real database (it creates and removes its own case):
 *   node src/models/__tests__/caseUpdate.test.mjs
 */
import pool from '../../config/database.js';
import Case from '../Case.js';

let failures = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) console.log(`        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

async function run() {
  console.log('Case.update -- applicant and defendant edits persist\n');

  const created = await Case.create({
    request_type: 'TEST_ORIGINAL_TYPE',
    is_called_for_court: false,
    applicant: { name: 'Original Applicant', phone_number: '111', address: 'Addr A' },
    wanted: { name: 'Original Defendant', phone_number: '222', address: 'Addr W' },
  });

  try {
    await Case.update(created.id, {
      request_type: 'TEST_UPDATED_TYPE',
      is_called_for_court: true,
      status: 'pending',
      applicant: { name: 'Edited Applicant', phone_number: '999', address: 'New Addr A' },
      wanted: { name: 'Edited Defendant', phone_number: '888', address: 'New Addr W' },
    });

    const after = await Case.findById(created.id);
    const applicant = after.applicants?.[0] || {};
    const wanted = after.wanted?.[0] || {};

    // These already worked -- guarding against a regression in the fix.
    check('request_type updated', after.request_type, 'TEST_UPDATED_TYPE');
    check('is_called_for_court updated', after.is_called_for_court, true);
    check('status updated', after.status, 'pending');

    // These are the reported bug.
    check('applicant name updated', applicant.name, 'Edited Applicant');
    check('applicant phone updated', applicant.phone_number, '999');
    check('applicant address updated', applicant.address, 'New Addr A');
    check('defendant name updated', wanted.name, 'Edited Defendant');
    check('defendant phone updated', wanted.phone_number, '888');
    check('defendant address updated', wanted.address, 'New Addr W');

    // A case created without parties must gain them on first edit, rather than
    // silently doing nothing because there is no row to update.
    const bare = await Case.create({ request_type: 'TEST_BARE', is_called_for_court: false });
    try {
      await Case.update(bare.id, {
        request_type: 'TEST_BARE',
        is_called_for_court: false,
        status: 'active',
        applicant: { name: 'Added Later', phone_number: '777', address: 'Addr L' },
        wanted: { name: 'Added Later W', phone_number: '666', address: 'Addr LW' },
      });
      const bareAfter = await Case.findById(bare.id);
      check('applicant inserted when absent', bareAfter.applicants?.[0]?.name, 'Added Later');
      check('defendant inserted when absent', bareAfter.wanted?.[0]?.name, 'Added Later W');
    } finally {
      await Case.delete(bare.id);
    }
  } finally {
    await Case.delete(created.id);
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
