/**
 * Retry utility with exponential backoff
 */

import { RetryConfig } from '../types';

/**
 * Executes a function with exponential backoff retry logic
 * @param fn - The async function to execute
 * @param config - Retry configuration (maxAttempts, initialDelayMs, maxDelayMs, backoffMultiplier)
 * @returns The result of the successful function execution
 * @throws The last error if all retry attempts fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  const { maxAttempts, initialDelayMs, maxDelayMs, backoffMultiplier } = config;

  let lastError: Error;
  let currentDelay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Try to execute the function
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this was the last attempt, throw the error
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      await sleep(currentDelay);

      // Calculate next delay with exponential backoff, capped at maxDelayMs
      currentDelay = Math.min(
        currentDelay * backoffMultiplier,
        maxDelayMs
      );
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError!;
}

/**
 * Sleep helper function
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
