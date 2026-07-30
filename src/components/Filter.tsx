import React from 'react';

// Define state union props matching the issue requirements
export interface FiltersProps {
  status: 'loading' | 'empty' | 'error' | 'success';
  error?: Error | string | null;

  // Add filter data/options props here
  options?: Array<{ label: string; value: string }>;
  onFilterChange?: (value: string) => void;
}

export const Filter: React.FC<FiltersProps> = ({ status, error, options = [] }) => {
  // Loading State
  if (status === 'loading') {
    return <div data-testid="filters-loading">Loading filters...</div>;
  }

  // Error State check
  if (status === 'error') {
    return (
      <div data-testid="filters-error" role="alert">
        {typeof error === 'string' ? error : error?.message || 'Failed to load filters'}
      </div>
    );
  }

  // Empty State validation & rendering
  if (status === 'empty' || options.length === 0) {
    return <div data-testid="filters-empty">No filters available</div>;
  }

  // Success State rendering
  return (
    <div data-testid="filters-success" className="filters-container">
      {options.map((opt) => (
        <label key={opt.value}>
          <input type="checkbox" value={opt.value} />
          {opt.label}
        </label>
      ))}
    </div>
  );
};