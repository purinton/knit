import * as Repo from './repo.mjs';
import * as GitHub from './gitHub.mjs';

/**
 * Consumes a webhook message and updates the corresponding repository.
 * @param {Object} params
 * @param {Object} params.message - The message object ({ raw, parsed }).
 * @param {Object} params.log - The log object for logging messages.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function consume({ message, log }) {
  // message: { raw, parsed }
  const post = message.parsed;
  if (!GitHub.validate({ post })) {
    if (log) log.error('[Consumer] GitHub validation failed');
    return false;
  }
  const repo = await Repo.get({ name: post.repository.full_name });
  if (!repo) {
    if (log) log.error('[Consumer] Repo not found:', post.repository.full_name);
    return false;
  }
  const updated = await repo.update({ body: post, log });
  if (!updated) {
    if (log) log.error('[Consumer] Repo update failed');
    return false;
  }
  if (log) log.info('[Consumer] Repo updated successfully');
  return true;
}
