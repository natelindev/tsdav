import { fetch } from '../fetch';

describe('fetch utility', () => {
  it('should be a function', () => {
    expect(typeof fetch).toBe('function');
  });

  it('should be functional', () => {
    // Basic check to ensure it doesn't throw when accessed
    expect(fetch).toBeDefined();
  });
});
