import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import OptimizedImage from '../OptimizedImage';

describe('OptimizedImage', () => {
  it('requests the supplied URL as-is so PNG/JPEG assets load without assumed .webp siblings', () => {
    render(<OptimizedImage src="/front.png" alt="Hero art" />);
    const img = screen.getByRole('img', { name: 'Hero art' });
    expect(img).toHaveAttribute('src', '/front.png');

    fireEvent.load(img);

    expect(img.className).toContain('opacity-100');
  });

  it('still reveals the image slot when the request errors', () => {
    render(<OptimizedImage src="/missing.png" alt="Missing" />);
    const img = screen.getByRole('img', { name: 'Missing' });
    fireEvent.error(img);
    expect(img.className).toContain('opacity-100');
  });
});
