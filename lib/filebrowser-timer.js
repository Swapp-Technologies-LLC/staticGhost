/**
 * Pure timer & session logic for time-boxed File Browser containers.
 * Extracted as pure functions so it can be tested without Docker installed.
 */

const FB_SESSION_MS = 15 * 60 * 1000;       // 15 minutes default session
const FB_EXTEND_MS = 15 * 60 * 1000;        // 15 minutes extension step
const FB_MAX_TOTAL_MS = 2 * 60 * 60 * 1000; // 2 hours maximum total session cap
const FB_IMAGE = 'filebrowser/filebrowser:v2.30.0';

/**
 * Calculate remaining milliseconds until deadline.
 * Clamps to 0, never returns negative values.
 */
function calculateRemainingMs(deadline, now = Date.now()) {
  if (!deadline || typeof deadline !== 'number') return 0;
  return Math.max(0, Math.floor(deadline - now));
}

/**
 * Format remaining milliseconds as MM:SS string.
 */
function formatTimeRemaining(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const padMin = String(minutes).padStart(2, '0');
  const padSec = String(seconds).padStart(2, '0');
  return `${padMin}:${padSec}`;
}

/**
 * Check if a session can be extended.
 * Refuses if adding extendMs would exceed startedAt + maxTotalMs.
 */
function canExtendFileBrowser(startedAt, currentDeadline, extendMs = FB_EXTEND_MS, maxTotalMs = FB_MAX_TOTAL_MS) {
  if (!startedAt || typeof startedAt !== 'number') {
    return { canExtend: false, reason: 'Invalid session start time' };
  }
  const maxDeadline = startedAt + maxTotalMs;
  if (currentDeadline >= maxDeadline) {
    return { canExtend: false, reason: 'Maximum 2-hour session limit reached' };
  }
  return { canExtend: true };
}

/**
 * Extend a file browser deadline.
 * Clamps new deadline to startedAt + maxTotalMs.
 */
function extendFileBrowserDeadline(startedAt, currentDeadline, now = Date.now(), extendMs = FB_EXTEND_MS, maxTotalMs = FB_MAX_TOTAL_MS) {
  const extendCheck = canExtendFileBrowser(startedAt, currentDeadline, extendMs, maxTotalMs);
  if (!extendCheck.canExtend) {
    return {
      success: false,
      deadline: currentDeadline,
      remainingMs: calculateRemainingMs(currentDeadline, now),
      reason: extendCheck.reason
    };
  }

  const maxDeadline = startedAt + maxTotalMs;
  const baseTime = Math.max(currentDeadline, now);
  const targetDeadline = baseTime + extendMs;
  const newDeadline = Math.min(targetDeadline, maxDeadline);

  return {
    success: true,
    deadline: newDeadline,
    remainingMs: calculateRemainingMs(newDeadline, now),
    reason: null
  };
}

/**
 * Startup-sweep container name matcher.
 * Matches `blog-filebrowser` if `blog` is in profileNames, but NOT `blog` itself,
 * and NOT a `-filebrowser` container whose base name is absent from profiles.
 */
function matchFileBrowserProfileName(containerName, profileNames = []) {
  if (!containerName || typeof containerName !== 'string') return false;
  if (!containerName.endsWith('-filebrowser')) return false;

  const baseName = containerName.slice(0, -12); // Remove '-filebrowser'
  if (!baseName) return false;

  return Array.isArray(profileNames) && profileNames.includes(baseName);
}

module.exports = {
  FB_SESSION_MS,
  FB_EXTEND_MS,
  FB_MAX_TOTAL_MS,
  FB_IMAGE,
  calculateRemainingMs,
  formatTimeRemaining,
  canExtendFileBrowser,
  extendFileBrowserDeadline,
  matchFileBrowserProfileName
};
