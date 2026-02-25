const pool = require("../config/db");

const MAX_WARNINGS = 3;
const DEFAULT_SUSPENSION_DAYS = 90;

async function getUser(userId) {
  const { rows } = await pool.query(
    "SELECT warning_count, suspended_until FROM users WHERE id = $1",
    [userId]
  );

  if (!rows.length) {
    return {
      warning_count: 0,
      suspended_until: null,
    };
  }

  return rows[0];
}

async function isSuspended(userId) {
  const user = await getUser(userId);

  if (!user.suspended_until) return false;

  const suspendedUntilTime = new Date(user.suspended_until).getTime();
  const now = Date.now();

  if (now > suspendedUntilTime) {
    await resetUser(userId);
    return false;
  }

  return true;
}

async function addWarning(userId) {
  const user = await getUser(userId);

  const currentWarnings = user.warning_count || 0;
  const warnings = Math.min(currentWarnings + 1, MAX_WARNINGS);

  await pool.query(
    "UPDATE users SET warning_count = $1 WHERE id = $2",
    [warnings, userId]
  );

  return {
    warningsUsed: warnings,
    warningsLeft: MAX_WARNINGS - warnings,
    reachedLimit: warnings >= MAX_WARNINGS,
  };
}

async function suspendUser(userId, days = DEFAULT_SUSPENSION_DAYS) {
  const suspendedUntil = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  );

  await pool.query(
    "UPDATE users SET suspended_until = $1, warning_count = 0 WHERE id = $2",
    [suspendedUntil, userId]
  );
}

async function resetUser(userId) {
  await pool.query(
    "UPDATE users SET warning_count = 0, suspended_until = NULL WHERE id = $1",
    [userId]
  );
}

module.exports = {
  getUser,
  isSuspended,
  addWarning,
  suspendUser,
  resetUser,
  MAX_WARNINGS,
};