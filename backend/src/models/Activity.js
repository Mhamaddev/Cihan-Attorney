import pool from '../config/database.js';

/** Newest entries returned to the admin feed. */
const FEED_LIMIT = 50;

class Activity {
  /**
   * Appends one entry to the audit trail.
   *
   * Never throws. Logging is observation, not part of the operation being
   * observed -- a failure to write history must not roll back or fail the case
   * edit that succeeded. Failures go to the server log instead.
   */
  static async record({ actorId, actorName, action, entityType, entityId, summary }) {
    try {
      await pool.query(
        `INSERT INTO activity_log
           (actor_id, actor_name, action, entity_type, entity_id, summary)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          actorId ?? null,
          actorName || 'unknown',
          action,
          entityType,
          entityId ?? null,
          // The column is VARCHAR(255); a long request type or filename would
          // otherwise abort the insert.
          summary ? String(summary).slice(0, 255) : null,
        ]
      );
    } catch (error) {
      console.error('Failed to record activity:', error.message);
    }
  }

  static async recent(limit = FEED_LIMIT) {
    const result = await pool.query(
      `SELECT id, actor_id, actor_name, action, entity_type, entity_id, summary, created_at
         FROM activity_log
        ORDER BY created_at DESC, id DESC
        LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}

export default Activity;
