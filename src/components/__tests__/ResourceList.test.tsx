import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ResourceList } from '../ResourceList';

type Sample = { id: string; name: string };

const SAMPLES: Sample[] = [
  { id: 'a', name: 'Alpha' },
  { id: 'b', name: 'Beta' },
];

function basicProps(
  overrides: Partial<React.ComponentProps<typeof ResourceList<Sample>>> = {}
) {
  return {
    items: SAMPLES,
    loading: false,
    emptyMessage: 'Nothing here.',
    getKey: (item: Sample) => item.id,
    removeDialogTitle: 'Delete item?',
    removeDialogConfirmLabel: 'Delete',
    onRemove: jest.fn(),
    renderRow: (
      item: Sample,
      { requestRemove }: { requestRemove: () => void }
    ) => (
      <>
        <span>{item.name}</span>
        <button type="button" onClick={requestRemove}>
          Remove {item.name}
        </button>
      </>
    ),
    ...overrides,
  };
}

describe('ResourceList', () => {
  it('renders the loading message while the first load is in flight', () => {
    render(<ResourceList {...basicProps({ items: null, loading: true })} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('uses a custom loading message when provided', () => {
    render(
      <ResourceList
        {...basicProps({
          items: null,
          loading: true,
          loadingMessage: 'Fetching…',
        })}
      />
    );
    expect(screen.getByText('Fetching…')).toBeInTheDocument();
  });

  it('renders the empty message when there are no items', () => {
    render(<ResourceList {...basicProps({ items: [] })} />);
    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
  });

  it('renders one row per item with stable keys', () => {
    const { container } = render(<ResourceList {...basicProps()} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container.querySelectorAll('ul > li')).toHaveLength(2);
  });

  it('wraps the list in a single polite, atomic live region', () => {
    render(<ResourceList {...basicProps()} />);
    const live = document.querySelector('[aria-live=polite]');
    expect(live).toBeInTheDocument();
    expect(live).toHaveAttribute('aria-atomic', 'true');
  });

  it('applies the provided row class name', () => {
    const { container } = render(
      <ResourceList {...basicProps({ rowClassName: 'custom-row' })} />
    );
    expect(container.querySelector('li.custom-row')).toBeInTheDocument();
  });

  it("opens the remove dialog when a row's remove control is triggered", () => {
    render(<ResourceList {...basicProps()} />);
    fireEvent.click(screen.getByRole('button', { name: /remove alpha/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent('Delete item?');
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('calls onRemove with the correct item when removal is confirmed', async () => {
    const onRemove = jest.fn().mockResolvedValue(undefined);
    render(<ResourceList {...basicProps({ onRemove })} />);
    fireEvent.click(screen.getByRole('button', { name: /remove alpha/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
    expect(onRemove).toHaveBeenCalledWith(SAMPLES[0]);
  });

  it('closes the dialog after confirming and stops rendering it', async () => {
    render(<ResourceList {...basicProps()} />);
    fireEvent.click(screen.getByRole('button', { name: /remove alpha/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });

  it('does not call onRemove when the dialog is cancelled', () => {
    const onRemove = jest.fn();
    render(<ResourceList {...basicProps({ onRemove })} />);
    fireEvent.click(screen.getByRole('button', { name: /remove alpha/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('supports a non-danger (default) dialog tone', () => {
    render(<ResourceList {...basicProps({ removeDialogTone: 'default' })} />);
    fireEvent.click(screen.getByRole('button', { name: /remove alpha/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders a confirm button label from removeDialogConfirmLabel', () => {
    render(
      <ResourceList {...basicProps({ removeDialogConfirmLabel: 'Drop' })} />
    );
    fireEvent.click(screen.getByRole('button', { name: /remove alpha/i }));
    expect(screen.getByRole('button', { name: /drop/i })).toBeInTheDocument();
  });
});

describe('ResourceList — table mode', () => {
  const TABLE_HEADERS = ['Name', 'Action'];

  function tableProps(
    overrides: Partial<React.ComponentProps<typeof ResourceList<Sample>>> = {}
  ) {
    return {
      items: SAMPLES,
      loading: false,
      emptyMessage: 'Nothing here.',
      getKey: (item: Sample) => item.id,
      removeDialogTitle: 'Delete item?',
      removeDialogConfirmLabel: 'Delete',
      onRemove: jest.fn(),
      renderRow: (item: Sample) => <span>{item.name}</span>,
      caption: 'All items',
      tableHeaders: TABLE_HEADERS,
      renderCells: (item: Sample, { requestRemove }: { requestRemove: () => void }) => [
        <span key="name">{item.name}</span>,
        <button key="rm" type="button" onClick={requestRemove}>
          Remove {item.name}
        </button>,
      ],
      ...overrides,
    };
  }

  it('renders a <table> when caption and renderCells are provided', () => {
    render(<ResourceList {...tableProps()} />);
    expect(document.querySelector('table')).toBeInTheDocument();
    expect(document.querySelector('ul')).not.toBeInTheDocument();
  });

  it('renders the caption text inside a <caption> element', () => {
    render(<ResourceList {...tableProps()} />);
    const caption = document.querySelector('table caption');
    expect(caption).toBeInTheDocument();
    expect(caption).toHaveTextContent('All items');
  });

  it('renders the caption as visually hidden (sr-only)', () => {
    render(<ResourceList {...tableProps()} />);
    const caption = document.querySelector('table caption');
    expect(caption).toHaveClass('sr-only');
  });

  it('renders column headers with scope="col"', () => {
    render(<ResourceList {...tableProps()} />);
    const colHeaders = document.querySelectorAll('thead th[scope="col"]');
    expect(colHeaders).toHaveLength(2);
    expect(colHeaders[0]).toHaveTextContent('Name');
    expect(colHeaders[1]).toHaveTextContent('Action');
  });

  it('renders the first cell of each row as a row header with scope="row"', () => {
    render(<ResourceList {...tableProps()} />);
    const rowHeaders = document.querySelectorAll('tbody th[scope="row"]');
    expect(rowHeaders).toHaveLength(2);
    expect(rowHeaders[0]).toHaveTextContent('Alpha');
    expect(rowHeaders[1]).toHaveTextContent('Beta');
  });

  it('renders data cells as <td> for non-first columns', () => {
    render(<ResourceList {...tableProps()} />);
    const tds = document.querySelectorAll('tbody td');
    expect(tds.length).toBeGreaterThanOrEqual(2);
  });

  it('falls back to <ul> when caption is set but renderCells is missing', () => {
    render(<ResourceList {...tableProps({ renderCells: undefined })} />);
    expect(document.querySelector('ul')).toBeInTheDocument();
    expect(document.querySelector('table')).not.toBeInTheDocument();
  });

  it('falls back to <ul> when renderCells is set but caption is missing', () => {
    render(<ResourceList {...tableProps({ caption: undefined })} />);
    expect(document.querySelector('ul')).toBeInTheDocument();
    expect(document.querySelector('table')).not.toBeInTheDocument();
  });

  it('still shows the empty message in table mode when items are empty', () => {
    render(<ResourceList {...tableProps({ items: [] })} />);
    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
    expect(document.querySelector('table')).not.toBeInTheDocument();
  });

  it('still shows loading in table mode when items are null', () => {
    render(<ResourceList {...tableProps({ items: null, loading: true })} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(document.querySelector('table')).not.toBeInTheDocument();
  });

  it('opens the remove dialog from a table row cell', () => {
    render(<ResourceList {...tableProps()} />);
    fireEvent.click(screen.getByRole('button', { name: /remove alpha/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent('Delete item?');
  });

  it('calls onRemove when removal is confirmed from a table row', async () => {
    const onRemove = jest.fn().mockResolvedValue(undefined);
    render(<ResourceList {...tableProps({ onRemove })} />);
    fireEvent.click(screen.getByRole('button', { name: /remove alpha/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
    expect(onRemove).toHaveBeenCalledWith(SAMPLES[0]);
  });
});
