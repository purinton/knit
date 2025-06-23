export function validate(post) {
  if (!post || !post.repository) {
    console.error('GitHub::validate post repository not set', post);
    return false;
  }
  return true;
}
