import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ProgressBar } from '../components/ui/ProgressBar';

describe('ProgressBar', () => {
  it('renders progress text correctly', () => {
    render(<ProgressBar progress={40} showText />);
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('clamps values below 0 and above 100', () => {
    const { rerender } = render(<ProgressBar progress={-10} showText />);
    expect(screen.getByText('0%')).toBeInTheDocument();

    rerender(<ProgressBar progress={150} showText />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});

