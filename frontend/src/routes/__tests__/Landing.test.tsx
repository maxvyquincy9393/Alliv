import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Landing } from '../Landing';

// Mock IntersectionObserver - Must be a class
beforeAll(() => {
  class IntersectionObserverMock {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    takeRecords = vi.fn();
  }
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
});

// Mock AnimatedBackground
vi.mock('../../components/AnimatedBackground', () => ({
  AnimatedBackground: () => <div data-testid="animated-background" />,
}));

// Mock LandingNavbar
vi.mock('../../components/LandingNavbar', () => ({
  LandingNavbar: () => <div data-testid="landing-navbar" />,
}));

describe('Landing Component', () => {
  it('renders main sections', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    expect(screen.getByText(/Collaborate without/i)).toBeInTheDocument();
    expect(screen.getByText(/the chaos/i)).toBeInTheDocument();
    expect(screen.getByText(/Now in Beta/i)).toBeInTheDocument();
    
    // Use getAllByText since "Start Building" appears in Hero CTA and HowItWorks section
    const startBuildingTexts = screen.getAllByText(/Start Building/i);
    expect(startBuildingTexts.length).toBeGreaterThan(0);
    
    // Check stats
    expect(screen.getByText('12k+')).toBeInTheDocument();
    expect(screen.getByText('Projects Shipped')).toBeInTheDocument();

    // Check features
    expect(screen.getByText(/Instant Matching/i)).toBeInTheDocument();
    const verifiedSkillsTexts = screen.getAllByText(/Verified Skills/i);
    expect(verifiedSkillsTexts.length).toBeGreaterThan(0);
  });

  it('renders CTA buttons', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    const startButtons = screen.getAllByText(/Start Building|Get Started Now/i);
    expect(startButtons.length).toBeGreaterThan(0);
    
    expect(screen.getByText(/Explore Talent/i)).toBeInTheDocument();
  });
});
