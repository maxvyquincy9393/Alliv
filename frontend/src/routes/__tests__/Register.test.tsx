import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Register } from '../Register';
import * as api from '../../services/api';

// Mock the api service
vi.mock('../../services/api', () => ({
  authAPI: {
    register: vi.fn(),
    requestVerification: vi.fn(),
  },
}));

// Mock AnimatedBackground
vi.mock('../../components/AnimatedBackground', () => ({
  AnimatedBackground: () => <div data-testid="animated-background" />,
}));

describe('Register Component', () => {
  it('renders register form correctly', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('validates input fields', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);

    expect(api.authAPI.register).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    (api.authAPI.register as any).mockResolvedValue({ data: { success: true } });
    (api.authAPI.requestVerification as any).mockResolvedValue({ data: { success: true } });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/John Doe/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), { target: { value: 'test@example.com' } });
    
    // Find password input by placeholder 'Min 8 chars, uppercase, lowercase, digit' or similar
    const passwordInput = screen.getByPlaceholderText(/Min 8 chars/i);
    fireEvent.change(passwordInput, { target: { value: 'Password123' } }); 

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(api.authAPI.register).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        birthdate: ''
      });
    });
  });
});
