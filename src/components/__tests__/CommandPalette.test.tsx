import { render, screen, fireEvent } from "@testing-library/react";
import { CommandPalette } from "../CommandPalette";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("CommandPalette", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders nothing when closed", () => {
    const { container } = render(<CommandPalette />);
    expect(container).toBeEmptyDOMElement();
  });

  describe("open/close via keyboard", () => {
    it("opens the dialog on Cmd+K", () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("opens the dialog on Ctrl+K", () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("toggles closed when Cmd+K is pressed while open", () => {
      render(<CommandPalette />);

      // Open
      fireEvent.keyDown(window, { key: "k", metaKey: true });
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Close
      fireEvent.keyDown(window, { key: "k", metaKey: true });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes on Escape", () => {
      render(<CommandPalette />);

      fireEvent.keyDown(window, { key: "k", metaKey: true });
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("does not open for unrelated key combinations", () => {
      render(<CommandPalette />);

      fireEvent.keyDown(window, { key: "j", metaKey: true });
      fireEvent.keyDown(window, { key: "k", altKey: true });
      fireEvent.keyDown(window, { key: "k" });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("clears query when closed", () => {
      render(<CommandPalette />);

      // Open and type something
      fireEvent.keyDown(window, { key: "k", metaKey: true });
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "pair" },
      });

      // Close
      fireEvent.keyDown(window, { key: "Escape" });

      // Reopen — query should be cleared
      fireEvent.keyDown(window, { key: "k", metaKey: true });
      expect(screen.getByRole("combobox")).toHaveValue("");
    });
  });

  describe("focus management", () => {
    it("focuses the search input on open", () => {
      jest.useFakeTimers();
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });

      // flush requestAnimationFrame callback
      jest.runAllTimers();

      expect(screen.getByRole("combobox")).toHaveFocus();
      jest.useRealTimers();
    });

    it("restores focus to the previously focused element on close", () => {
      render(
        <>
          <button>Trigger</button>
          <CommandPalette />
        </>,
      );

      const trigger = screen.getByRole("button", { name: "Trigger" });
      trigger.focus();

      fireEvent.keyDown(window, { key: "k", metaKey: true });
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      expect(trigger).toHaveFocus();
    });
  });

  describe("backdrop click", () => {
    it("closes when the backdrop is clicked", () => {
      render(<CommandPalette />);

      fireEvent.keyDown(window, { key: "k", metaKey: true });
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();

      fireEvent.click(dialog);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("does not close when clicking inside the panel", () => {
      render(<CommandPalette />);

      fireEvent.keyDown(window, { key: "k", metaKey: true });
      const input = screen.getByRole("combobox");
      fireEvent.click(input);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has modal dialog semantics", () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });

      const dialog = screen.getByRole("dialog", { name: "Command palette" });
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });
  });

  describe("filtering", () => {
    it("shows all routes when query is empty", () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThanOrEqual(8);
    });

    it("filters routes by title", () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });

      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "stat" },
      });

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent("Stats");
    });

    it("shows no-results message when filter matches nothing", () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });

      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "xyznonexistent" },
      });

      expect(
        screen.getByText("No matching routes found."),
      ).toBeInTheDocument();
      expect(screen.queryByRole("option")).not.toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("navigates on Enter when a match is highlighted", () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });

      // First item (Home) should be highlighted by default
      fireEvent.keyDown(window, { key: "Enter" });

      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("navigates to the correct route on click", () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });

      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "stats" },
      });
      const option = screen.getByRole("option");
      fireEvent.click(option.querySelector("button")!);

      expect(mockPush).toHaveBeenCalledWith("/stats");
    });

    it("does not navigate on Enter when there are no matches", () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });

      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "xyznonexistent" },
      });
      fireEvent.keyDown(window, { key: "Enter" });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("arrow key navigation", () => {
    it("highlights the first item by default", () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "true");
    });

    it("ArrowDown moves selection down", () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });

      fireEvent.keyDown(window, { key: "ArrowDown" });

      const options = screen.getAllByRole("option");
      expect(options[1]).toHaveAttribute("aria-selected", "true");
      expect(options[0]).toHaveAttribute("aria-selected", "false");
    });

    it("ArrowUp moves selection up", () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });

      // Move down first
      fireEvent.keyDown(window, { key: "ArrowDown" });
      fireEvent.keyDown(window, { key: "ArrowDown" });

      // Move back up
      fireEvent.keyDown(window, { key: "ArrowUp" });

      const options = screen.getAllByRole("option");
      expect(options[1]).toHaveAttribute("aria-selected", "true");
    });

    it("ArrowDown wraps to first after last", () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });

      const optionCount = screen.getAllByRole("option").length;
      for (let i = 0; i < optionCount; i++) {
        fireEvent.keyDown(window, { key: "ArrowDown" });
      }

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "true");
    });

    it("ArrowUp wraps to last from first", () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });

      fireEvent.keyDown(window, { key: "ArrowUp" });

      const options = screen.getAllByRole("option");
      expect(options[options.length - 1]).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("resets selected index when query changes", () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });

      // Move down a few items
      fireEvent.keyDown(window, { key: "ArrowDown" });
      fireEvent.keyDown(window, { key: "ArrowDown" });

      // Change query
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "stats" },
      });

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("route descriptions", () => {
    it("shows route descriptions alongside titles", () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });

      expect(
        screen.getByText("StableRoute dashboard landing page."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Manage registered routing pairs."),
      ).toBeInTheDocument();
    });
  });
});
