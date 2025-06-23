/**
 * Validates a GitHub webhook payload.
 * @param {Object} params
 * @param {Object} params.post - The webhook payload.
 * @returns {boolean} True if valid, false otherwise.
 */
export function validate({ post }) {
  if (!post || !post.repository) {
    console.error('GitHub::validate post repository not set', post);
    return false;
  }
  return true;
}
