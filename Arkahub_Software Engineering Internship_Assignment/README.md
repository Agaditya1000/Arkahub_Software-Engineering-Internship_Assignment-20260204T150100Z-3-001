# EnergyGrid Data Aggregator Solution

This repository contains the complete solution for the EnergyGrid Data Aggregator coding assignment. It includes both the Mock API Server (legacy system simulation) and the Node.js Client Solution (the implementation).

## Project Structure

- **`/` (Root)**: Contains the Mock API Server code.
- **`/solution`**: Contains the Client Solution code.

---

## Part 1: The Mock Server (EnergyGrid System)

The mock server simulates the strict "EnergyGrid" legacy API.

### Prerequisites
- Node.js (v14+)
- valid `npm` installation

### Setup & Run
1.  Open a terminal in the **root** folder.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    ```
    *Output*: `⚡ EnergyGrid Mock API running on port 3000`

### Constraints (Enforced by Server)
- **Rate Limit**: Strictly **1 request per second**. (Returns `429` if exceeded).
- **Batch Limit**: Max **10 devices** per request. (Returns `400` if exceeded).
- **Security**: Requires a custom **MD5 Signature** header.

---

## Part 2: The Client Solution

The client is a robust Node.js application designed to fetch data for 500 devices while strictly adhering to the server's constraints.

### Prerequisites
- The Mock Server **MUST** be running (see above).
- Open a **new** terminal window.

### Setup & Run
1.  Navigate to the solution folder:
    ```bash
    cd solution
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the client:
    ```bash
    npm start
    ```
    *Or manually: `node client.js`*

### Implementation Details
My solution (`solution/client.js`) implements the following logic to handle the constraints:

1.  **Rate Limiting**:
    - Implemented a custom `RateLimiter` class.
    - Enforces a **1050ms delay** between requests.
    - This ensures we never hit the `429` error by staying safely above the 1s limit.

2.  **Batching**:
    - The 500 dummy serial numbers are split into **50 batches** of 10.
    - This respects the maximum batch size limit.

3.  **Security**:
    - Generates a valid MD5 signature for every request using:
    - `MD5( URL_PATH + TOKEN + TIMESTAMP )`

4.  **Reliability**:
    - Includes automatic retry logic for network errors.

### Verification
Running the client produces a log showing 50 successful batch fetches, taking approximately 50-55 seconds to complete, with zero errors.
