// This module is now deprecated. Use @purinton/discord-webhook directly via notifier.mjs

import fetch from 'node-fetch';

/**
 * Sends a message to a Discord webhook (deprecated, use @purinton/discord-webhook).
 * @param {Object} params
 * @param {string} params.url - The webhook URL.
 * @param {Array} params.embeds - The embed objects.
 * @param {string} [params.username] - The username to display.
 * @param {string} [params.avatar_url] - The avatar URL to display.
 */
export async function send({ url, embeds, username, avatar_url }) {
  const data = { embeds };
  if (username) data.username = username;
  if (avatar_url) data.avatar_url = avatar_url;
  const body = JSON.stringify(data);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      body,
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        `Discord message send failed: ${res.status} ${res.statusText} - ${errorText}`
      );
    }
  } catch (err) {
    console.error('Error sending Discord message: ' + err.message);
  }
}
