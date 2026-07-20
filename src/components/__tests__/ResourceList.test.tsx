import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ResourceList } from "../ResourceList";

type Sample = { id: string; name: string };

const SAMPLES: Sample[] = [
  { id: "a", name: "Alpha" },
  { id: "b", name: "Beta" },
];

function basicProps(overrides: Partial<React.ComponentProps<typeof ResourceList<Sample>>> = {}) {
  return {
    items: SAMPLES,
    loading: false,
    emptyMessage: "Nothing here.",
    getKey: (item: Sample) => item.id,
    removeDialogTitle: "Delete item?",
    removeDialogConfirmLabel: "Delete",
    onRemove: jest.fn(),
    renderRow: (item: Sample, { requestRemove }: { requestRemove: () => void }) => (
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

describe("ResourceList", () => {
  it("renders the loading message while the first load is in flight", () => {
    render(<ResourceList {...basicProps({ items: null, loading: true })} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("uses a custom loading message when provided", () => {
    render(
      <ResourceList {...basicProps({ items: null, loading: true, loadingMessage: "Fetching…" })} />,
    );
    expect(screen.getByText("Fetching…")).toBeInTheDocument();
  });

  it("renders the empty message when there are no items", () => {
    render(<ResourceList {...basicProps({ items: [] })} />);
    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
  });

  it("renders one row per item with stable keys", () => {
    const { container } = render(<ResourceList {...basicProps()} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(container.querySelectorAll("ul > li")).toHaveLength(2);
  });

  it("wraps the list in a single polite, atomic live region", () => {
    render(<ResourceList {...basicProps()} />);
    const live = document.querySelector("[aria-live=polite]");
    expect(live).toBeInTheDocument();
    expect(live).toHaveAttribute("aria-atomic", "true");
  });

  it("applies the provided row class name", () => {
    const { container } = render(
      <ResourceList {...basicProps({ rowClassName: "custom-row" })} />,
    );
    expect(container.querySelector("li.custom-row")).toBeInTheDocument();
  });

  it("opens the remove dialog when a row's remove control is triggered", () => {
    render(<ResourceList {...basicProps()} />);
    fireEvent.click(screen.getByRole("button", { name: /remove alpha/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Delete item?");
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("calls onRemove with the correct item when removal is confirmed", async () => {
    const onRemove = jest.fn().mockResolvedValue(undefined);
    render(<ResourceList {...basicProps({ onRemove })} />);
    fireEvent.click(screen.getByRole("button", { name: /remove alpha/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
    expect(onRemove).toHaveBeenCalledWith(SAMPLES[0]);
  });

  it("closes the dialog after confirming and stops rendering it", async () => {
    render(<ResourceList {...basicProps()} />);
    fireEvent.click(screen.getByRole("button", { name: /remove alpha/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("does not call onRemove when the dialog is cancelled", () => {
    const onRemove = jest.fn();
    render(<ResourceList {...basicProps({ onRemove })} />);
    fireEvent.click(screen.getByRole("button", { name: /remove alpha/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("supports a non-danger (default) dialog tone", () => {
    render(<ResourceList {...basicProps({ removeDialogTone: "default" })} />);
    fireEvent.click(screen.getByRole("button", { name: /remove alpha/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders a confirm button label from removeDialogConfirmLabel", () => {
    render(<ResourceList {...basicProps({ removeDialogConfirmLabel: "Drop" })} />);
    fireEvent.click(screen.getByRole("button", { name: /remove alpha/i }));
    expect(screen.getByRole("button", { name: /drop/i })).toBeInTheDocument();
  });
});
