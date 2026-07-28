import Activity from '../models/Activity.js';

/**
 * Records an audit entry for the authenticated request.
 *
 * Takes `req` so the actor comes from the verified token rather than anything
 * the client sent. Fire-and-forget by design: callers do not await it, and
 * Activity.record swallows its own failures, so the audit trail can never turn
 * a successful case edit into a failed request.
 */
export function logActivity(req, { action, entityType, entityId, summary } = {}) {
  const actor = req?.user || {};
  Activity.record({
    actorId: actor.id,
    actorName: actor.username,
    action,
    entityType,
    entityId,
    summary,
  });
}
