import { describe, expect, it } from 'vitest';
import { isRemoteImageUrl } from './image-url';

describe('isRemoteImageUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isRemoteImageUrl('https://images.unsplash.com/photo.jpg')).toBe(true);
    expect(isRemoteImageUrl('http://example.com/a.png')).toBe(true);
  });

  it('rejects local paths and empty values', () => {
    expect(isRemoteImageUrl('')).toBe(false);
    expect(isRemoteImageUrl(null)).toBe(false);
    expect(isRemoteImageUrl('/assets/evento.jpg')).toBe(false);
    expect(isRemoteImageUrl('file:///tmp/x.jpg')).toBe(false);
    expect(isRemoteImageUrl('assets/evento.jpg')).toBe(false);
  });
});
