import fetch from 'node-fetch';

export async function send(url, embeds, username, avatar_url) {
  const data = { embeds };
  if (username) data.username = username;
  if (avatar_url) data.avatar_url = avatar_url;
  const body = JSON.stringify(data);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      body,
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Discord message send failed: ${res.status} ${res.statusText} - ${errorText}`);
    }
  } catch (err) {
    console.error('Error sending Discord message: ' + err.message);
  }
}
