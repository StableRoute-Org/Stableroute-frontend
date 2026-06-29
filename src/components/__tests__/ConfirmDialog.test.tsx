import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "../ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders nothing when open is false", () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        title="Delete item"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("exposes its title via aria-labelledby and has modal semantics", () => {
    render(
      <ConfirmDialog
        open
        title="Delete item"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    const dialog = screen.getByRole("dialog", { name: "Delete item" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("fires onConfirm when the confirm button is clicked", () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmDialog
        open
        title="Delete item"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("fires onCancel when the cancel button is clicked", () => {
    const onCancel = jest.fn();
    render(
      <ConfirmDialog
        open
        title="Delete item"
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders custom confirmLabel and cancelLabel", () => {
    render(
      <ConfirmDialog
        open
        title="Delete item"
        confirmLabel="Yes, delete"
        cancelLabel="No, keep it"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(
      screen.getByRole("button", { name: "Yes, delete" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "No, keep it" })
    ).toBeInTheDocument();
  });

  it("renders the optional description when supplied", () => {
    render(
      <ConfirmDialog
        open
        title="Delete item"
        description="This action cannot be undone."
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(
      screen.getByText("This action cannot be undone.")
    ).toBeInTheDocument();
  });

  it("omits the description when not supplied", () => {
    render(
      <ConfirmDialog
        open
        title="Delete item"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(
      screen.queryByText(/cannot be undone/i)
    ).not.toBeInTheDocument();
  });
});
