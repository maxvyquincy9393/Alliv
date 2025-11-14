// src/components/GlassButton.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GlassButton } from './GlassButton';

describe('GlassButton', () => {
  it('should render its children correctly', () => {
    render(<GlassButton>Click Me</GlassButton>);
    // Check if the button with the text "Click Me" is in the document.
    // The `name` option in getByRole refers to the accessible name, which for a button is its content.
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should show a loading spinner when loading', () => {
    render(<GlassButton loading={true}>Submit</GlassButton>);
    // The button should not be accessible by its name "Submit" because the text is replaced by the spinner.
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument();
    
    // We can look for the button and check its contents, but a simpler way
    // is to check that the button is disabled and doesn't show its text.
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should be disabled when the disabled prop is true', () => {
    render(<GlassButton disabled={true}>Cannot Click</GlassButton>);
    const button = screen.getByRole('button', { name: /cannot click/i });
    expect(button).toBeDisabled();
  });
});
