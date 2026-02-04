# EnergyGrid Data Aggregator - Client Solution

This is the Node.js client solution for the EnergyGrid coding assignment.

## Prerequisites

- Node.js installed.
- The Mock Server must be running on `http://localhost:3000`.

## Setup

1.  Navigate to the `solution` directory:
    ```bash
    cd solution
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

## Usage

1.  Ensure the mock API is running (run `npm start` in the parent directory).
2.  Run the client:
    ```bash
    npm start
    ```
    Or:
    ```bash
    node client.js
    ```

## Approach

### 1. Structure
The solution is a single file script `client.js` that orchestrates the data fetching.

### 2. Rate Limiting
A custom `RateLimiter` class is used to ensure strictly one request per second.
- It maintains a queue of tasks.
- It processes tasks sequentially with a `setTimeout` delay of **1050ms** (1s + 50ms buffer) between requests to account for network variability and ensure we never hit the HTTP 429 error.

### 3. Signature Generation
- The signature is generated using `MD5(URL_PATH + TOKEN + TIMESTAMP)`.
- **Note**: The server uses `req.originalUrl` for verification, so we sign the path `/device/real/query` instead of the full URL.

### 4. Batching
- We generate 500 serial numbers (`SN-000` to `SN-499`).
- These are sliced into chunks of 10 seral numbers per batch to respect the batch size limit.

### 5. Error Handling
- The `fetchBatch` function includes retry logic.
- If a 429 occurs (unlikely with our limiter), it waits 2s and retries.
- For other errors, it retries up to 3 times before failing the batch.
