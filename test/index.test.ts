import { describe, it, expect } from 'vitest';
import { watch } from '../src';

describe('watch library', () => {
  it('should be importable', () => {
    expect(typeof watch).toBe('function');
  });
});
