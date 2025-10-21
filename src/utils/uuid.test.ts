/**
 * Unit tests for UUID utility functions
 */

import { describe, test, expect } from 'vitest';
import { generateUUID } from './uuid';

describe('generateUUID', () => {
  test('returns a valid UUID v4 format', () => {
    const uuid = generateUUID();

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // where x is any hexadecimal digit and y is one of 8, 9, A, or B
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(uuid).toMatch(uuidV4Regex);
  });

  test('multiple calls generate unique UUIDs', () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    const uuid3 = generateUUID();

    expect(uuid1).not.toBe(uuid2);
    expect(uuid2).not.toBe(uuid3);
    expect(uuid1).not.toBe(uuid3);
  });

  test('UUID format matches regex pattern', () => {
    const uuids = Array.from({ length: 10 }, () => generateUUID());

    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    uuids.forEach((uuid) => {
      expect(uuid).toMatch(uuidV4Regex);
      expect(uuid).toHaveLength(36); // 32 hex chars + 4 hyphens
      expect(uuid.charAt(14)).toBe('4'); // Version 4 indicator
      expect(['8', '9', 'a', 'b', 'A', 'B']).toContain(uuid.charAt(19)); // Variant indicator
    });
  });
});
