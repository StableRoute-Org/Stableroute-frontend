import { fireEvent, render, screen, within } from '@testing-library/react';
import { ColumnVisibilityToggle } from '../ColumnVisibilityToggle';
import { DEFAULT_COLUMN_VISIBILITY } from '@/lib/columnVisibility';

const defaultProps = {
  visibility: DEFAULT_COLUMN_VISIBILITY,
  onToggle: jest.fn(),
};

beforeEach(() => {
  defaultProps.onToggle.mockClear();
});

describe('ColumnVisibilityToggle', () => {
  it('renders a Columns button', () => {
    render(<ColumnVisibilityToggle {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: /Columns/ })
    ).toBeInTheDocument();
  });

  it('does not show the menu initially', () => {
    render(<ColumnVisibilityToggle {...defaultProps} />);
    expect(
      screen.queryByRole('group', { name: 'Toggle column visibility' })
    ).not.toBeInTheDocument();
  });

  it('opens the menu on click', () => {
    render(<ColumnVisibilityToggle {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Columns/ }));
    expect(
      screen.getByRole('group', { name: 'Toggle column visibility' })
    ).toBeInTheDocument();
  });

  it('shows all three column checkboxes', () => {
    render(<ColumnVisibilityToggle {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Columns/ }));
    expect(screen.getByLabelText('Source')).toBeInTheDocument();
    expect(screen.getByLabelText('Destination')).toBeInTheDocument();
    expect(screen.getByLabelText('Actions')).toBeInTheDocument();
  });

  it('checks checkboxes based on visibility prop', () => {
    render(
      <ColumnVisibilityToggle
        visibility={{ source: true, destination: false, actions: true }}
        onToggle={defaultProps.onToggle}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Columns/ }));
    expect(screen.getByLabelText('Source')).toBeChecked();
    expect(screen.getByLabelText('Destination')).not.toBeChecked();
    expect(screen.getByLabelText('Actions')).toBeChecked();
  });

  it('calls onToggle with the column id when a checkbox is clicked', () => {
    render(<ColumnVisibilityToggle {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Columns/ }));
    fireEvent.click(screen.getByLabelText('Source'));
    expect(defaultProps.onToggle).toHaveBeenCalledWith('source');
  });

  it('closes the menu when clicking outside', () => {
    render(
      <div>
        <span data-testid="outside">outside</span>
        <ColumnVisibilityToggle {...defaultProps} />
      </div>
    );
    fireEvent.click(screen.getByRole('button', { name: /Columns/ }));
    expect(
      screen.getByRole('group', { name: 'Toggle column visibility' })
    ).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(
      screen.queryByRole('group', { name: 'Toggle column visibility' })
    ).not.toBeInTheDocument();
  });

  it('closes the menu on Escape key', () => {
    render(<ColumnVisibilityToggle {...defaultProps} />);
    const button = screen.getByRole('button', { name: /Columns/ });
    fireEvent.click(button);
    expect(
      screen.getByRole('group', { name: 'Toggle column visibility' })
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(
      screen.queryByRole('group', { name: 'Toggle column visibility' })
    ).not.toBeInTheDocument();
  });

  it('returns focus to the trigger button after Escape', () => {
    render(<ColumnVisibilityToggle {...defaultProps} />);
    const button = screen.getByRole('button', { name: /Columns/ });
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(button).toHaveFocus();
  });

  it('disables the last visible column checkbox', () => {
    render(
      <ColumnVisibilityToggle
        visibility={{ source: true, destination: false, actions: false }}
        onToggle={defaultProps.onToggle}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Columns/ }));
    // Source is the last visible column – its checkbox should be disabled.
    expect(screen.getByLabelText('Source')).toBeDisabled();
    // The other two are already unchecked but not the "last visible" so enabled.
    expect(screen.getByLabelText('Destination')).not.toBeDisabled();
    expect(screen.getByLabelText('Actions')).not.toBeDisabled();
  });

  it('reports the correct count in the button label', () => {
    render(
      <ColumnVisibilityToggle
        visibility={{ source: true, destination: false, actions: true }}
        onToggle={defaultProps.onToggle}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Columns (2 of 3 visible)' })
    ).toBeInTheDocument();
  });

  it('sets aria-expanded on the trigger button', () => {
    render(<ColumnVisibilityToggle {...defaultProps} />);
    const button = screen.getByRole('button', { name: /Columns/ });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('has aria-haspopup on the trigger button', () => {
    render(<ColumnVisibilityToggle {...defaultProps} />);
    const button = screen.getByRole('button', { name: /Columns/ });
    expect(button).toHaveAttribute('aria-haspopup', 'true');
  });
});
