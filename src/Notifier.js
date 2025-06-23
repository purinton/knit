import Discord from './Discord.js';

class Notifier {
  static async send(notifyUrl, post, log, hasError) {
    if (!notifyUrl) return;
    const embed = await this.createEmbed(post, log, hasError);
    if (hasError) {
      embed.color = 0xFF0000;
      embed.title = `\u274c Error: ${embed.title}`;
    } else {
      embed.title = `\u2705 ${embed.title}`;
    }
    // Override webhook name and avatar
    await Discord.send(
      notifyUrl,
      [embed],
      'Knit',
      'https://knit.purinton.us/assets/knit.png'
    );
  }

  static async createEmbed(post, knitResults, hasError) {
    const embed = {};
    // Tag push: special embed
    if (post.ref && post.ref.startsWith('refs/tags/')) {
      const repoName = post.repository?.full_name || 'Unknown Repository';
      const repoUrl = post.repository?.html_url || '';
      const tag = post.ref.replace('refs/tags/', '');
      const repoShortName = repoName.split('/').pop();
      // Compose tag URL: https://github.com/<owner>/<repo>/releases/tag/<tag>
      const tagUrl = repoName && tag ? `https://github.com/${repoName}/releases/tag/${encodeURIComponent(tag)}` : repoUrl;
      embed.title = `${repoShortName} ${tag} has been released! 🎉`;
      embed.url = tagUrl;
      embed.color = 0xFFD700; // gold
      embed.timestamp = new Date().toISOString();
      embed.thumbnail = { url: 'https://purinton.us/logos/purinton_64.png' };
      // Author info (same as push event)
      let authorName = post.pusher?.name || 'unknown';
      let authorIcon = undefined;
      let authorUrl = undefined;
      if (post.sender && post.sender.avatar_url) {
        authorIcon = post.sender.avatar_url;
      } else if (post.repository && post.repository.owner && post.repository.owner.avatar_url) {
        authorIcon = post.repository.owner.avatar_url;
      }
      if (post.pusher && post.pusher.name) {
        authorUrl = `https://github.com/${post.pusher.name}`;
      }
      embed.author = { name: authorName };
      if (authorIcon) embed.author.icon_url = authorIcon;
      if (authorUrl) embed.author.url = authorUrl;
      embed.footer = { text: 'GitHub Tag Push Event' };
      return embed;
    }
    if (post.commits) {
      const repoName = post.repository?.full_name || 'Unknown Repository';
      const repoUrl = post.repository?.html_url || '';
      const branch = post.ref ? post.ref.replace(/^refs\/heads\//, '') : 'unknown';
      const pusher = post.pusher?.name || 'unknown';
      embed.title = `New Commits Pushed to ${repoName}`;
      embed.url = repoUrl;
      embed.color = 0x00FF00;
      embed.timestamp = post.head_commit?.timestamp || new Date().toISOString();
      embed.thumbnail = { url: 'https://knit.purinton.us/assets/github.png' };

      // Build file changes summary (only what exists in payload)
      let addedFiles = new Set();
      let removedFiles = new Set();
      let modifiedFiles = new Set();
      if (Array.isArray(post.commits)) {
        for (const commit of post.commits) {
          if (Array.isArray(commit.added)) {
            commit.added.forEach(f => addedFiles.add(f));
          }
          if (Array.isArray(commit.removed)) {
            commit.removed.forEach(f => removedFiles.add(f));
          }
          if (Array.isArray(commit.modified)) {
            commit.modified.forEach(f => modifiedFiles.add(f));
          }
        }
      }
      // Also check head_commit for tag pushes, etc
      if (post.head_commit) {
        if (Array.isArray(post.head_commit.added)) {
          post.head_commit.added.forEach(f => addedFiles.add(f));
        }
        if (Array.isArray(post.head_commit.removed)) {
          post.head_commit.removed.forEach(f => removedFiles.add(f));
        }
        if (Array.isArray(post.head_commit.modified)) {
          post.head_commit.modified.forEach(f => modifiedFiles.add(f));
        }
      }
      // Remove files from added/removed if they're also in modified
      modifiedFiles.forEach(f => {
        addedFiles.delete(f);
        removedFiles.delete(f);
      });

      // Compose branch and commit count on one line
      let description = `Branch: **${branch}** - Commits: **${post.commits.length}**\n`;
      for (const commit of post.commits) {
        const message = commit.message || '';
        const url = commit.url || '';
        const shortId = commit.id?.substring(0, 7) || '';
        description += `**${shortId}**: [${message}](${url})\n`;
      }
      // Only include command log if error
      if (hasError && knitResults) {
        description += `\n\u0060\u0060\u0060\n${knitResults}\n\u0060\u0060\u0060`;
      }
      // Cap at 2000 chars
      if (description.length > 2000) {
        description = description.substr(0, 1997) + '...';
      }
      embed.description = description.trim();

      // Set author field with pusher info and avatar if available
      let authorName = pusher;
      let authorIcon = undefined;
      let authorUrl = undefined;
      // Try to get avatar from sender or repository.owner
      if (post.sender && post.sender.avatar_url) {
        authorIcon = post.sender.avatar_url;
      } else if (post.repository && post.repository.owner && post.repository.owner.avatar_url) {
        authorIcon = post.repository.owner.avatar_url;
      }
      // Try to get GitHub profile URL for the pusher
      if (post.pusher && post.pusher.name) {
        authorUrl = `https://github.com/${post.pusher.name}`;
      }
      embed.author = { name: authorName };
      if (authorIcon) embed.author.icon_url = authorIcon;
      if (authorUrl) embed.author.url = authorUrl;

      // Add file lists as fields, with counts in the field names
      embed.fields = [];
      if (addedFiles.size > 0) {
        embed.fields.push({
          name: `New (${addedFiles.size})`,
          value: Array.from(addedFiles).join('\n'),
          inline: false
        });
      }
      if (removedFiles.size > 0) {
        embed.fields.push({
          name: `Deleted (${removedFiles.size})`,
          value: Array.from(removedFiles).join('\n'),
          inline: false
        });
      }
      if (modifiedFiles.size > 0) {
        embed.fields.push({
          name: `Modified (${modifiedFiles.size})`,
          value: Array.from(modifiedFiles).join('\n'),
          inline: false
        });
      }
      embed.footer = { text: 'GitHub Push Event' };
    } else {
      const repoName = post.repository?.full_name || 'Unknown Repository';
      const action = post.action || 'Event';
      embed.title = `${repoName} - ${action}`;
      embed.color = 0x3498db;
      embed.description = 'See details on GitHub for more information.';
      embed.thumbnail = { url: 'https://knit.purinton.us/assets/github.png' };
      if (hasError && knitResults) {
        embed.description += `\n\u0060\u0060\u0060\n${knitResults}\n\u0060\u0060\u0060`;
      }
      embed.footer = { text: 'GitHub Event' };
    }

    return embed;
  }
}

export default Notifier;
