import * as Consumer from './consumer.mjs';

let tasks = [];
let isProcessing = false;

/**
 * Queues a payload for publishing to the consumer.
 * @param {Object} params
 * @param {Object} params.payload - The payload to publish ({ raw, parsed }).
 */
export function publish({ raw, parsed, log }) {
  if (log) log.info('[Publisher] Queuing payload for publish');
  tasks.push({ raw, parsed, log });
  setImmediate(processTasks);
}

/**
 * Processes all queued publish tasks.
 * @private
 */
async function processTasks() {
  if (isProcessing || tasks.length === 0) return;
  isProcessing = true;
  while (tasks.length > 0) {
    const { raw, parsed, log } = tasks.shift();
    try {
      if (log) log.info('[Publisher] Sending payload to Consumer');
      await Consumer.consume({ message: { raw, parsed }, log });
    } catch (err) {
      if (log) log.error('[Publisher] Error sending to Consumer:', err);
    }
  }
  isProcessing = false;
}
