import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { AppShellExtras } from '../AppShellExtras';

jest.mock('next/navigation');

describe('AppShellExtras', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('mounts the root overlay components but does not render dialogs initially', () => {
    render(<AppShellExtras />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the command palette with Ctrl+K and does not open the shortcuts help', async () => {
    render(<AppShellExtras />);

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: 'Command palette' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('dialog', { name: 'Keyboard shortcuts' })
      ).not.toBeInTheDocument();
    });
  });

  it('opens the command palette with Cmd+K on Mac', async () => {
    render(<AppShellExtras />);

    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: 'Command palette' })
      ).toBeInTheDocument();
    });
  });

  it('opens the shortcuts help with ? and does not open the command palette', async () => {
    render(<AppShellExtras />);

    fireEvent.keyDown(window, { key: '?', shiftKey: true });

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: 'Keyboard shortcuts' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('dialog', { name: 'Command palette' })
      ).not.toBeInTheDocument();
    });
  });

  it('does not open the shortcuts help while focus is in a text input', async () => {
    render(
      <>
        <input aria-label="Search field" />
        <AppShellExtras />
      </>
    );

    const input = screen.getByRole('textbox', { name: 'Search field' });
    input.focus();

    fireEvent.keyDown(input, { key: '?', shiftKey: true });

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'Keyboard shortcuts' })
      ).not.toBeInTheDocument();
    });
  });

  it('does not stack overlays when ? is pressed while the palette input is focused', async () => {
    render(<AppShellExtras />);

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: 'Command palette' })
      ).toBeInTheDocument();
    });

    const paletteInput = screen.getByPlaceholderText('Jump to…');
    fireEvent.keyDown(paletteInput, { key: '?', shiftKey: true });

    expect(
      screen.getByRole('dialog', { name: 'Command palette' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'Keyboard shortcuts' })
    ).not.toBeInTheDocument();
  });
});
