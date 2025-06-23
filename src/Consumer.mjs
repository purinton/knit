import Repo from './repo.mjs';
import GitHub from './github.mjs';

export async function consume(message) {
  // message: { raw, parsed }
  const post = message.parsed;
  if (!GitHub.validate(post)) {
    console.error('[Consumer] GitHub validation failed');
    return false;
  }
  const repo = await Repo.get(post.repository.full_name);
  if (!repo) {
    console.error('[Consumer] Repo not found:', post.repository.full_name);
    return false;
  }
  const updated = await repo.update(post);
  if (!updated) {
    console.error('[Consumer] Repo update failed');
    return false;
  }
  console.log('[Consumer] Repo updated successfully');
  return true;
}
