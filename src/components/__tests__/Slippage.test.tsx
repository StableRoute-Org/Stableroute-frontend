import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import { Slippage } from '../Slippage';

describe('Slippage Component', () => {
  it('renders default preset options and custom input', () => {
    render(<Slippage value={0.5} />);

    expect(screen.getByRole('button', { name: '0.1%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '0.5%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1%' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /slippage tolerance/i })).toBeInTheDocument();
  });

  it('marks active preset button with aria-pressed', () => {
    render(<Slippage value={0.5} />);

    const preset01 = screen.getByRole('button', { name: '0.1%' });
    const preset05 = screen.getByRole('button', { name: '0.5%' });

    expect(preset01).toHaveAttribute('aria-pressed', 'false');
    expect(preset05).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onChange when preset button is clicked', () => {
    const handleChange = jest.fn();
    render(<Slippage value={0.5} onChange={handleChange} />);

    fireEvent.click(screen.getByRole('button', { name: '1%' }));
    expect(handleChange).toHaveBeenCalledWith(1.0);
  });

  it('allows entering custom valid slippage and calls onChange', () => {
    const handleChange = jest.fn();
    render(<Slippage onChange={handleChange} />);

    const customInput = screen.getByRole('textbox', { name: /slippage tolerance/i });
    fireEvent.change(customInput, { target: { value: '2.5' } });

    expect(handleChange).toHaveBeenCalledWith(2.5);
  });

  it('validates custom input invalid string and displays error', () => {
    const handleChange = jest.fn();
    render(<Slippage onChange={handleChange} />);

    const customInput = screen.getByRole('textbox', { name: /slippage tolerance/i });
    fireEvent.change(customInput, { target: { value: 'abc' } });

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid number.');
    expect(customInput).toHaveAttribute('aria-invalid', 'true');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('validates custom input below minimum bound', () => {
    const handleChange = jest.fn();
    render(<Slippage min={0.1} onChange={handleChange} />);

    const customInput = screen.getByRole('textbox', { name: /slippage tolerance/i });
    fireEvent.change(customInput, { target: { value: '0.05' } });

    expect(screen.getByRole('alert')).toHaveTextContent('Minimum slippage is 0.1%.');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('validates custom input above maximum bound', () => {
    const handleChange = jest.fn();
    render(<Slippage max={10} onChange={handleChange} />);

    const customInput = screen.getByRole('textbox', { name: /slippage tolerance/i });
    fireEvent.change(customInput, { target: { value: '15' } });

    expect(screen.getByRole('alert')).toHaveTextContent('Maximum slippage is 10%.');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('clears error when custom input is emptied', () => {
    render(<Slippage />);
    const customInput = screen.getByRole('textbox', { name: /slippage tolerance/i });

    fireEvent.change(customInput, { target: { value: 'abc' } });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.change(customInput, { target: { value: '' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders loading state when status="loading"', () => {
    render(<Slippage status="loading" />);

    expect(screen.getByTestId('slippage-loading')).toHaveTextContent('Updating...');
    expect(screen.getByRole('button', { name: '0.5%' })).toBeDisabled();
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders empty state when status="empty"', () => {
    render(<Slippage status="empty" message="No options configured" />);

    expect(screen.getByTestId('slippage-empty')).toHaveTextContent('No options configured');
    expect(screen.queryByRole('button', { name: '0.5%' })).not.toBeInTheDocument();
  });

  it('renders error state and handles onRetry when status="error"', () => {
    const handleRetry = jest.fn();
    render(<Slippage status="error" message="Failed to fetch quote" onRetry={handleRetry} />);

    expect(screen.getByTestId('slippage-error')).toHaveTextContent('Failed to fetch quote');

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders success state message when status="success"', () => {
    render(<Slippage status="success" message="Slippage tolerance saved" />);

    expect(screen.getByRole('status')).toHaveTextContent('Slippage tolerance saved');
  });

  it('respects disabled prop', () => {
    const handleChange = jest.fn();
    render(<Slippage disabled value={0.5} onChange={handleChange} />);

    const presetButton = screen.getByRole('button', { name: '0.1%' });
    expect(presetButton).toBeDisabled();

    fireEvent.click(presetButton);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('renders custom preset options', () => {
    render(<Slippage options={[0.2, 0.8, 2.0]} />);

    expect(screen.getByRole('button', { name: '0.2%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '0.8%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2%' })).toBeInTheDocument();
  });

  it('does not re-render when props are referentially stable (memoized)', () => {
    const props = { value: 0.5, status: 'idle' as const };
    const { rerender } = render(<Slippage {...props} />);

    rerender(<Slippage {...props} />);
    expect(screen.getByRole('button', { name: '0.5%' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('memoizes rendering and skips re-renders when parent state updates with stable props (render count check)', () => {
    let renderCount = 0;

    const TrackedSlippage = (props: React.ComponentProps<typeof Slippage>) => {
      renderCount++;
      return <Slippage {...props} />;
    };

    const ParentComponent = () => {
      const [dummyState, setDummyState] = useState(0);
      const [value] = useState(0.5);
      const onChange = React.useCallback(() => {}, []);

      return (
        <div>
          <button onClick={() => setDummyState((s) => s + 1)}>
            Re-render Parent ({dummyState})
          </button>
          <TrackedSlippage value={value} onChange={onChange} />
        </div>
      );
    };

    render(<ParentComponent />);
    expect(renderCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: /Re-render Parent/i }));
    expect(renderCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: /Re-render Parent/i }));
    expect(renderCount).toBe(1);
  });

  it('skips re-renders when options array reference changes but elements are identical', () => {
    let renderCount = 0;

    const TrackedSlippage = (props: React.ComponentProps<typeof Slippage>) => {
      renderCount++;
      return <Slippage {...props} />;
    };

    const ParentComponent = () => {
      const [options, setOptions] = useState([0.1, 0.5, 1.0]);

      return (
        <div>
          <button onClick={() => setOptions([0.1, 0.5, 1.0])}>
            Set Identical Options
          </button>
          <TrackedSlippage options={options} />
        </div>
      );
    };

    render(<ParentComponent />);
    expect(renderCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: /Set Identical Options/i }));
    expect(renderCount).toBe(1);
  });

  it('re-renders when props change (value, options, status, or disabled)', () => {
    let renderCount = 0;

    const TrackedSlippage = (props: React.ComponentProps<typeof Slippage>) => {
      renderCount++;
      return <Slippage {...props} />;
    };

    const ParentComponent = () => {
      const [value, setValue] = useState(0.5);
      const [status, setStatus] = useState<'idle' | 'loading'>('idle');

      return (
        <div>
          <button onClick={() => setValue(1.0)}>Change Value</button>
          <button onClick={() => setStatus('loading')}>Change Status</button>
          <TrackedSlippage value={value} status={status} />
        </div>
      );
    };

    render(<ParentComponent />);
    expect(renderCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: /Change Value/i }));
    expect(renderCount).toBe(2);
    expect(screen.getByRole('button', { name: '1%' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /Change Status/i }));
    expect(renderCount).toBe(3);
    expect(screen.getByTestId('slippage-loading')).toBeInTheDocument();
  });
});

