import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the app name', () => {
    render(<App />);
    expect(screen.getByText('汉字小伙伴')).toBeTruthy();
  });
});
