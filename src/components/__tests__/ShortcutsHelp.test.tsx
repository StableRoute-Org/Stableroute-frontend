import { fireEvent, render, screen } from "@testing-library/react";
import { ShortcutsHelp, shortcuts } from "../ShortcutsHelp";

describe("ShortcutsHelp", () => {
  it("opens the named dialog when ? is pressed", () => {
    render(<ShortcutsHelp />);

    fireEvent.keyDown(window, { key: "?", shiftKey: true });

    const dialog = screen.getByRole("dialog", {
      name: "Keyboard shortcuts",
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    for (const shortcut of shortcuts) {
      expect(screen.getByText(shortcut.keys)).toBeInTheDocument();
    }
  });

  it("also opens when Shift+/ is reported by the browser", () => {
    render(<ShortcutsHelp />);

    fireEvent.keyDown(window, { key: "/", shiftKey: true });

    expect(
      screen.getByRole("dialog", { name: "Keyboard shortcuts" })
    ).toBeInTheDocument();
  });

  it("ignores ? while focus is in an editable field", () => {
    render(
      <>
        <input aria-label="Source asset" />
        <ShortcutsHelp />
      </>
    );

    const input = screen.getByRole("textbox", { name: "Source asset" });
    input.focus();
    fireEvent.keyDown(input, { key: "?", shiftKey: true });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ignores ? inside contenteditable regions", () => {
    render(
      <>
        <div contentEditable aria-label="Editable note" role="textbox" />
        <ShortcutsHelp />
      </>
    );

    const editor = screen.getByRole("textbox", { name: "Editable note" });
    editor.focus();
    fireEvent.keyDown(editor, { key: "?", shiftKey: true });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes with Escape", () => {
    render(<ShortcutsHelp />);
    fireEvent.keyDown(window, { key: "?", shiftKey: true });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when the backdrop is clicked", () => {
    render(<ShortcutsHelp />);
    fireEvent.keyDown(window, { key: "?", shiftKey: true });

    fireEvent.mouseDown(screen.getByRole("dialog", { name: "Keyboard shortcuts" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes from the close button", () => {
    render(<ShortcutsHelp />);
    fireEvent.keyDown(window, { key: "?", shiftKey: true });

    fireEvent.click(
      screen.getByRole("button", { name: "Close keyboard shortcuts" })
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
