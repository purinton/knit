import Consumer from './Consumer.js';

class Publisher {
    #tasks = [];
    #isProcessing = false;

    publish(payload) {
        console.log('[Publisher] Queuing payload for publish');
        this.#tasks.push(payload); // payload: { raw, parsed }
        setImmediate(() => this.#process());
    }

    async #process() {
        if (this.#isProcessing || this.#tasks.length === 0) return;
        this.#isProcessing = true;
        while (this.#tasks.length > 0) {
            const payload = this.#tasks.shift();
            try {
                console.log('[Publisher] Sending payload to Consumer');
                await Consumer.consume(payload); // Use imported Consumer directly
            } catch (err) {
                console.error('[Publisher] Error sending to Consumer:', err);
            }
        }
        this.#isProcessing = false;
    }
}

export default Publisher;
