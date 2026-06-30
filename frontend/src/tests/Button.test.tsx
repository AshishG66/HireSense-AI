
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../components/atoms/Button';

describe('Button component', () => {
  test('renders children text correctly', () => {
    render(<Button>Submit Code</Button>);
    expect(screen.getByText('Submit Code')).toBeInTheDocument();
  });

  test('is disabled and shows spinner when isLoading is true', () => {
    render(<Button isLoading>Click Me</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('triggers click handler when clicked', () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>Click Me</Button>);
    const btn = screen.getByText('Click Me');
    fireEvent.click(btn);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
