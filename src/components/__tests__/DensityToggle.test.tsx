import { render, screen, fireEvent } from '@testing-library/react';
import { DensityToggle } from '../DensityToggle';

describe('DensityToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-density');
  });

  it('renders correctly', () => {
    render(<DensityToggle />);
    expect(screen.getByText(/comfortable/i)).toBeInTheDocument();
    expect(screen.getByText(/compact/i)).toBeInTheDocument();
  });

  it('toggles density and persists to localStorage', () => {
    render(<DensityToggle />);

    const compactRadio = screen.getByLabelText(/compact/i);
    fireEvent.click(compactRadio);

    expect(compactRadio).toBeChecked();
    expect(localStorage.getItem('stableroute.density')).toBe('compact');
    expect(document.documentElement.getAttribute('data-density')).toBe('compact');

    const comfortableRadio = screen.getByLabelText(/comfortable/i);
    fireEvent.click(comfortableRadio);

    expect(comfortableRadio).toBeChecked();
    expect(localStorage.getItem('stableroute.density')).toBe('comfortable');
    expect(document.documentElement.getAttribute('data-density')).toBe('comfortable');
  });
});
