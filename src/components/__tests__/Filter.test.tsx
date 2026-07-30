import { render, screen } from '@testing-library/react';
import React from 'react';
import { Filter } from '../Filter';

describe('Filter Component', () => {
  it('renders loading state deterministically', () => {
    render(<Filter status="loading" />);

    expect(screen.getByTestId('filters-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('filters-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('filters-success')).not.toBeInTheDocument();
  });

  it('renders empty state deterministically when no options exist', () => {
    render(<Filter status="empty" options={[]} />);

    expect(screen.getByTestId('filters-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('filters-loading')).not.toBeInTheDocument();
  });

  it('renders error state deterministically', () => {
    render(<Filter status="error" error="Network Error" />);

    expect(screen.getByTestId('filters-error')).toBeInTheDocument();
    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(screen.queryByTestId('filters-loading')).not.toBeInTheDocument();
  });

  it('renders success state with filter options deterministically', () => {
    const options = [{ label: 'Active', value: 'active' }];
    render(<Filter status="success" options={options} />);

    expect(screen.getByTestId('filters-success')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByTestId('filters-loading')).not.toBeInTheDocument();
  });
});