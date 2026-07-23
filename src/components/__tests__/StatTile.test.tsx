import { render, screen } from '@testing-library/react';
import { StatTile } from '../StatTile';

describe('StatTile', () => {
  it('renders string label and value with dt/dd semantics', () => {
    render(<StatTile label="Pairs" value="42" />);
    expect(screen.getByText('Pairs').tagName).toBe('DT');
    expect(screen.getByText('42').tagName).toBe('DD');
  });

  it('renders ReactNode label and value', () => {
    render(
      <StatTile
        label={<span data-testid="label-node">Volume</span>}
        value={<strong data-testid="value-node">1,024</strong>}
      />
    );
    expect(screen.getByTestId('label-node')).toBeInTheDocument();
    expect(screen.getByTestId('value-node')).toBeInTheDocument();
  });

  it('uses semantic neutral color tokens for border and label', () => {
    render(<StatTile label="Trades" value="123" />);
    const container = screen.getByText('Trades').closest('div');
    expect(container?.className).toMatch(/border-neutral-200/);
    expect(container?.className).toMatch(/dark:border-neutral-800/);
    expect(screen.getByText('Trades').className).toMatch(/text-neutral-500/);
  });

  it('renders trend with neutral direction by default', () => {
    render(<StatTile label="Rate" value="5.2%" trend="+0.1%" />);
    const trend = screen.getByText('+0.1%');
    expect(trend.className).toMatch(/text-neutral-500/);
  });

  it('renders trend with success (up) semantic color', () => {
    render(
      <StatTile label="Rate" value="5.2%" trend="+0.1%" trendDirection="up" />
    );
    const trend = screen.getByText('+0.1%');
    expect(trend.className).toMatch(/text-success-600/);
    expect(trend.className).toMatch(/dark:text-success-400/);
  });

  it('renders trend with danger (down) semantic color', () => {
    render(
      <StatTile label="Rate" value="5.2%" trend="-0.1%" trendDirection="down" />
    );
    const trend = screen.getByText('-0.1%');
    expect(trend.className).toMatch(/text-danger-600/);
    expect(trend.className).toMatch(/dark:text-danger-400/);
  });

  it('renders trend with neutral semantic color when direction is neutral', () => {
    render(
      <StatTile label="Rate" value="5.2%" trend="0%" trendDirection="neutral" />
    );
    const trend = screen.getByText('0%');
    expect(trend.className).toMatch(/text-neutral-500/);
  });

  it('does not render trend when trend prop is undefined', () => {
    render(<StatTile label="Pairs" value="42" />);
    expect(screen.queryByText(/\+|−|0%/)).not.toBeInTheDocument();
  });

  it('applies correct structural classes to container', () => {
    render(<StatTile label="Test" value="100" />);
    const container = screen.getByText('Test').closest('div');
    expect(container?.className).toMatch(/rounded-lg/);
    expect(container?.className).toMatch(/border/);
    expect(container?.className).toMatch(/p-4/);
    expect(container?.className).toMatch(/text-center/);
  });

  it('applies correct styling classes to dd element', () => {
    render(<StatTile label="Label" value="Value" trend="Trend" />);
    const dd = screen.getByText('Value').closest('dd');
    expect(dd?.className).toMatch(/mt-1/);
    expect(dd?.className).toMatch(/flex/);
    expect(dd?.className).toMatch(/items-baseline/);
    expect(dd?.className).toMatch(/justify-center/);
    expect(dd?.className).toMatch(/gap-2/);
    expect(dd?.className).toMatch(/text-2xl/);
    expect(dd?.className).toMatch(/font-semibold/);
  });
});
