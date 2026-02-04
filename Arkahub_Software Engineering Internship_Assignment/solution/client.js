const axios = require('axios');
const crypto = require('crypto');

// Configuration
const BASE_URL = 'http://localhost:3000/device/real/query';
const URL_PATH = '/device/real/query';
const AUTH_TOKEN = 'interview_token_123';
const TOTAL_DEVICES = 500;
const BATCH_SIZE = 10;
const RATE_LIMIT_DELAY = 1000; // 1 second exactly, maybe add buffer? 1000ms might be tight if network is fast. Safe to do 1050? Let's stick to 1000 as per requirement "strictly 1 req/sec" usually means min interval.

// 1. Generate Dummy Serial Numbers
function generateSerialNumbers(count) {
    const serials = [];
    for (let i = 0; i < count; i++) {
        // Pad with zeros to 3 digits (e.g., SN-005)
        const paddedNum = String(i).padStart(3, '0');
        serials.push(`SN-${paddedNum}`);
    }
    return serials;
}

// 2. Generate Signature
function generateSignature(urlPath, token, timestamp) {
    const data = urlPath + token + timestamp;
    return crypto.createHash('md5').update(data).digest('hex');
}

// 3. Rate Limiter
class RateLimiter {
    constructor(delay) {
        this.delay = delay;
        this.queue = [];
        this.isProcessing = false;
    }

    add(fn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject });
            this.process();
        });
    }

    async process() {
        if (this.isProcessing) return;
        if (this.queue.length === 0) return;

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const { fn, resolve, reject } = this.queue.shift();

            try {
                const result = await fn();
                resolve(result);
            } catch (error) {
                reject(error);
            }

            // Wait for the delay before processing the next item
            // Only wait if there are more items to process to avoid unnecessary delay at the end
            if (this.queue.length > 0) {
                await new Promise(r => setTimeout(r, this.delay));
            }
        }

        this.isProcessing = false;
    }
}

// 4. Fetch Data Batch
async function fetchBatch(batch, retryCount = 0) {
    const timestamp = Date.now();
    const signature = generateSignature(URL_PATH, AUTH_TOKEN, timestamp);

    try {
        const payload = { sn_list: batch };
        const response = await axios.post(BASE_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'timestamp': timestamp.toString(),
                'signature': signature
            }
        });

        console.log(`Fetch success: ${batch[0]} ... ${batch[batch.length - 1]} (Timestamp: ${timestamp})`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 429) {
            console.warn(`Rate limit hit 429! Retrying in 2s...`);
            await new Promise(r => setTimeout(r, 2000));
            return fetchBatch(batch, retryCount + 1);
        } else if (retryCount < 3) {
            console.warn(`Error fetching batch (Attempt ${retryCount + 1}): ${error.message}. Retrying...`);
            await new Promise(r => setTimeout(r, 1000));
            return fetchBatch(batch, retryCount + 1);
        } else {
            console.error(`Failed to fetch batch after retries: ${error.message}`);
            return null; // or throw
        }
    }
}

// Main Execution
async function main() {
    console.log("Starting EnergyGrid Client...");

    const serials = generateSerialNumbers(TOTAL_DEVICES);
    console.log(`Generated ${serials.length} serial numbers.`);

    // Create batches
    const batches = [];
    for (let i = 0; i < serials.length; i += BATCH_SIZE) {
        batches.push(serials.slice(i, i + BATCH_SIZE));
    }
    console.log(`Created ${batches.length} batches.`);

    // Add 50ms buffer to rate limit just in case of clock drift or slight processing speedups
    const limiter = new RateLimiter(RATE_LIMIT_DELAY + 50);

    const results = [];
    let processedCount = 0;

    const promises = batches.map((batch, index) => {
        return limiter.add(() => fetchBatch(batch))
            .then(data => {
                if (data) {
                    // Assuming data is an object with serials as keys or a list? 
                    // Let's assume the mock returns a map or list. 
                    // We'll just push the raw response for now and aggregate later.
                    results.push(data);
                    processedCount += batch.length;
                }
            })
            .catch(err => console.error(`Batch ${index} failed completely:`, err));
    });

    await Promise.all(promises);

    console.log("\n--- Final Report ---");
    console.log(`Total Devices: ${TOTAL_DEVICES}`);
    console.log(`Successfully Processed: ${processedCount}`);

    
}

main().catch(console.error);
