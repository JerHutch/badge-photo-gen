/**
 * Unit tests for retry utility with exponential backoff
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { retryWithBackoff } from './retry';
import { RetryConfig } from '../types';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('successful operation returns result without retry', async () => {
    const successFn = vi.fn().mockResolvedValue('success');

    const config: RetryConfig = {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
    };

    const promise = retryWithBackoff(successFn, config);
    const result = await promise;

    expect(result).toBe('success');
    expect(successFn).toHaveBeenCalledTimes(1);
  });

  test('retries on failure with exponential backoff', async () => {
    const failTwiceThenSucceed = vi
      .fn()
      .mockRejectedValueOnce(new Error('Attempt 1 failed'))
      .mockRejectedValueOnce(new Error('Attempt 2 failed'))
      .mockResolvedValueOnce('success');

    const config: RetryConfig = {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
    };

    const promise = retryWithBackoff(failTwiceThenSucceed, config);

    // Fast forward through delays
    await vi.runAllTimersAsync();

    const result = await promise;

    expect(result).toBe('success');
    expect(failTwiceThenSucceed).toHaveBeenCalledTimes(3);
  });

  test('max attempts is respected', async () => {
    const alwaysFail = vi.fn().mockRejectedValue(new Error('Always fails'));

    const config: RetryConfig = {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
    };

    const promise = retryWithBackoff(alwaysFail, config);

    // Fast forward through delays
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('Always fails');
    expect(alwaysFail).toHaveBeenCalledTimes(3);
  });

  test('delay increases exponentially', async () => {
    const failTwiceThenSucceed = vi
      .fn()
      .mockRejectedValueOnce(new Error('Attempt 1 failed'))
      .mockRejectedValueOnce(new Error('Attempt 2 failed'))
      .mockResolvedValueOnce('success');

    const config: RetryConfig = {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    };

    const promise = retryWithBackoff(failTwiceThenSucceed, config);

    // First attempt fails immediately
    await vi.advanceTimersByTimeAsync(0);
    expect(failTwiceThenSucceed).toHaveBeenCalledTimes(1);

    // Second attempt after 100ms delay
    await vi.advanceTimersByTimeAsync(100);
    expect(failTwiceThenSucceed).toHaveBeenCalledTimes(2);

    // Third attempt after 200ms delay (100 * 2)
    await vi.advanceTimersByTimeAsync(200);
    expect(failTwiceThenSucceed).toHaveBeenCalledTimes(3);

    const result = await promise;
    expect(result).toBe('success');
  });

  test('delay is capped at maxDelayMs', async () => {
    const failThreeTimesThenSucceed = vi
      .fn()
      .mockRejectedValueOnce(new Error('Attempt 1 failed'))
      .mockRejectedValueOnce(new Error('Attempt 2 failed'))
      .mockRejectedValueOnce(new Error('Attempt 3 failed'))
      .mockResolvedValueOnce('success');

    const config: RetryConfig = {
      maxAttempts: 4,
      initialDelayMs: 100,
      maxDelayMs: 150, // Cap the delay
      backoffMultiplier: 2,
    };

    const promise = retryWithBackoff(failThreeTimesThenSucceed, config);

    // First attempt fails immediately
    await vi.advanceTimersByTimeAsync(0);
    expect(failThreeTimesThenSucceed).toHaveBeenCalledTimes(1);

    // Second attempt after 100ms delay
    await vi.advanceTimersByTimeAsync(100);
    expect(failThreeTimesThenSucceed).toHaveBeenCalledTimes(2);

    // Third attempt after 150ms delay (capped, would be 200ms)
    await vi.advanceTimersByTimeAsync(150);
    expect(failThreeTimesThenSucceed).toHaveBeenCalledTimes(3);

    // Fourth attempt after 150ms delay (capped, would be 400ms)
    await vi.advanceTimersByTimeAsync(150);
    expect(failThreeTimesThenSucceed).toHaveBeenCalledTimes(4);

    const result = await promise;
    expect(result).toBe('success');
  });

  test('final error is thrown after all attempts fail', async () => {
    const alwaysFail = vi.fn().mockRejectedValue(new Error('Final error'));

    const config: RetryConfig = {
      maxAttempts: 2,
      initialDelayMs: 50,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
    };

    const promise = retryWithBackoff(alwaysFail, config);

    // Fast forward through delays
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('Final error');
    expect(alwaysFail).toHaveBeenCalledTimes(2);
  });

  test('handles non-Error thrown values', async () => {
    const throwString = vi
      .fn()
      .mockRejectedValueOnce('string error')
      .mockRejectedValueOnce('string error')
      .mockRejectedValueOnce('string error');

    const config: RetryConfig = {
      maxAttempts: 3,
      initialDelayMs: 50,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
    };

    const promise = retryWithBackoff(throwString, config);

    // Fast forward through delays
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('string error');
    expect(throwString).toHaveBeenCalledTimes(3);
  });

  test('returns complex data types correctly', async () => {
    const complexResult = {
      id: 123,
      name: 'test',
      nested: { value: true },
    };

    const successFn = vi.fn().mockResolvedValue(complexResult);

    const config: RetryConfig = {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
    };

    const result = await retryWithBackoff(successFn, config);

    expect(result).toEqual(complexResult);
    expect(successFn).toHaveBeenCalledTimes(1);
  });

  test('handles single attempt configuration', async () => {
    const failOnce = vi.fn().mockRejectedValue(new Error('Failed'));

    const config: RetryConfig = {
      maxAttempts: 1,
      initialDelayMs: 100,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
    };

    const promise = retryWithBackoff(failOnce, config);

    await expect(promise).rejects.toThrow('Failed');
    expect(failOnce).toHaveBeenCalledTimes(1);
  });
});
