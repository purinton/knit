import * as Consumer from './consumer.mjs';

let tasks = [];
let isProcessing = false;

export function publish(payload) {
  console.log('[Publisher] Queuing payload for publish');
  tasks.push(payload); // payload: { raw, parsed }
  setImmediate(processTasks);
}

async function processTasks() {
  if (isProcessing || tasks.length === 0) return;
  isProcessing = true;
  while (tasks.length > 0) {
    const payload = tasks.shift();
    try {
      console.log('[Publisher] Sending payload to Consumer');
      await Consumer.consume(payload);
    } catch (err) {
      console.error('[Publisher] Error sending to Consumer:', err);
    }
  }
  isProcessing = false;
}
