import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { CommandPalette } from "../CommandPalette";

jest.mock("next/navigation");

describe("CommandPalette", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  describe("Dialog Structure", () => {
    it("does not render when not opened", () => {
      const { container } = render(<CommandPalette />);
      expect(container).toBeEmptyDOMElement();
    });

    it("renders with dialog and modal semantics when opened", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        const dialog = screen.getByRole("dialog", { name: "Command palette" });
        expect(dialog).toHaveAttribute("aria-modal", "true");
      });
    });

    it("closes when backdrop is clicked", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const dialog = screen.getByRole("dialog");
      fireEvent.click(dialog);
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("does not close when content is clicked", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const content = screen.getByPlaceholderText("Jump to…").closest("div");
      fireEvent.click(content!);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("Combobox ARIA Roles", () => {
    it("input has role=combobox with proper ARIA attributes", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        const input = screen.getByPlaceholderText("Jump to…");
        expect(input).toHaveAttribute("role", "combobox");
        expect(input).toHaveAttribute("aria-label", "Search routes");
        expect(input).toHaveAttribute("aria-controls", "command-palette-listbox");
      });
    });

    it("sets aria-expanded=true when matches exist", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        const input = screen.getByPlaceholderText("Jump to…");
        expect(input).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("sets aria-expanded=false when no matches exist", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        const input = screen.getByPlaceholderText("Jump to…");
        expect(input).toBeInTheDocument();
      });
      const input = screen.getByPlaceholderText("Jump to…");
      fireEvent.change(input, { target: { value: "zzzzzzz" } });
      expect(input).toHaveAttribute("aria-expanded", "false");
    });

    it("listbox has correct role and id", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        const listbox = screen.getByRole("listbox");
        expect(listbox).toHaveAttribute("id", "command-palette-listbox");
      });
    });

    it("options have role=option with aria-selected", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        const options = screen.getAllByRole("option");
        expect(options.length).toBeGreaterThan(0);
        options.forEach((option) => {
          expect(option).toHaveAttribute("aria-selected");
        });
      });
    });
  });

  describe("Keyboard Navigation", () => {
    it("opens palette with Ctrl+K", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("opens palette with Cmd+K on Mac", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", metaKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("toggles palette when already open", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("closes palette with Escape", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      fireEvent.keyDown(window, { key: "Escape" });
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("navigates down with ArrowDown", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const input = screen.getByPlaceholderText("Jump to…");
      fireEvent.keyDown(input, { key: "ArrowDown" });
      await waitFor(() => {
        const firstOption = screen.getAllByRole("option")[0];
        expect(firstOption).toHaveAttribute("aria-selected", "true");
      });
    });

    it("navigates up with ArrowUp", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const input = screen.getByPlaceholderText("Jump to…");
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowUp" });
      await waitFor(() => {
        const options = screen.getAllByRole("option");
        expect(options[0]).toHaveAttribute("aria-selected", "true");
      });
    });

    it("prevents navigation beyond last option", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const input = screen.getByPlaceholderText("Jump to…");
      const options = screen.getAllByRole("option");
      const numOptions = options.length;

      for (let i = 0; i < numOptions + 2; i++) {
        fireEvent.keyDown(input, { key: "ArrowDown" });
      }

      await waitFor(() => {
        const lastOption = options[numOptions - 1];
        expect(lastOption).toHaveAttribute("aria-selected", "true");
      });
    });

    it("prevents navigation above first option", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const input = screen.getByPlaceholderText("Jump to…");
      fireEvent.keyDown(input, { key: "ArrowUp" });

      const options = screen.getAllByRole("option");
      options.forEach((option) => {
        expect(option).toHaveAttribute("aria-selected", "false");
      });
    });

    it("selects option with Enter key", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const input = screen.getByPlaceholderText("Jump to…");
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("does not navigate with Enter when no option selected", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const input = screen.getByPlaceholderText("Jump to…");
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("Search Filtering", () => {
    it("filters routes by query", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const input = screen.getByPlaceholderText("Jump to…");
      fireEvent.change(input, { target: { value: "admin" } });

      const options = screen.getAllByRole("option");
      options.forEach((option) => {
        expect(option.textContent?.toLowerCase()).toContain("admin");
      });
    });

    it("shows 'No routes found' when no matches", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const input = screen.getByPlaceholderText("Jump to…");
      fireEvent.change(input, { target: { value: "zzzzzzz" } });

      expect(screen.getByText("No routes found")).toBeInTheDocument();
    });

    it("resets active index when query changes", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const input = screen.getByPlaceholderText("Jump to…");
      fireEvent.keyDown(input, { key: "ArrowDown" });
      await waitFor(() => {
        const firstOption = screen.getAllByRole("option")[0];
        expect(firstOption).toHaveAttribute("aria-selected", "true");
      });

      fireEvent.change(input, { target: { value: "a" } });

      const options = screen.getAllByRole("option");
      options.forEach((option) => {
        expect(option).toHaveAttribute("aria-selected", "false");
      });
    });

    it("is case-insensitive", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const input = screen.getByPlaceholderText("Jump to…");
      fireEvent.change(input, { target: { value: "ADMIN" } });

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
      options.forEach((option) => {
        expect(option.textContent?.toLowerCase()).toContain("admin");
      });
    });
  });

  describe("Mouse Interaction", () => {
    it("sets active index on mouse enter", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const options = screen.getAllByRole("option");
      fireEvent.mouseEnter(options[1]);

      expect(options[1]).toHaveAttribute("aria-selected", "true");
      expect(options[0]).toHaveAttribute("aria-selected", "false");
    });

    it("navigates to route on click", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const options = screen.getAllByRole("option");
      fireEvent.click(options[0]);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Focus Management", () => {
    it("focuses input on open", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        const input = screen.getByPlaceholderText("Jump to…");
        expect(input).toHaveFocus();
      });
    });

    it("sets aria-activedescendant when option is selected", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const input = screen.getByPlaceholderText("Jump to…");
      fireEvent.keyDown(input, { key: "ArrowDown" });

      await waitFor(() => {
        const activedescendant = input.getAttribute("aria-activedescendant");
        expect(activedescendant).toBeTruthy();
      });
    });

    it("clears aria-activedescendant when no option selected", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        const input = screen.getByPlaceholderText("Jump to…");
        const activedescendant = input.getAttribute("aria-activedescendant");
        expect(activedescendant).toBeFalsy();
      });
    });
  });

  describe("State Cleanup", () => {
    it("clears query and active index on close", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const input = screen.getByPlaceholderText("Jump to…");
      fireEvent.change(input, { target: { value: "admin" } });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(window, { key: "Escape" });

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        const newInput = screen.getByPlaceholderText("Jump to…");
        expect(newInput).toHaveValue("");
        const options = screen.getAllByRole("option");
        options.forEach((option) => {
          expect(option).toHaveAttribute("aria-selected", "false");
        });
      });
    });

    it("clears state after navigation", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const input = screen.getByPlaceholderText("Jump to…");
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        const newInput = screen.getByPlaceholderText("Jump to…");
        expect(newInput).toHaveValue("");
        const options = screen.getAllByRole("option");
        options.forEach((option) => {
          expect(option).toHaveAttribute("aria-selected", "false");
        });
      });
    });
  });

  describe("Visual Feedback", () => {
    it("applies active style to selected option", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const input = screen.getByPlaceholderText("Jump to…");
      fireEvent.keyDown(input, { key: "ArrowDown" });

      await waitFor(() => {
        const activeOption = screen.getAllByRole("option")[0];
        expect(activeOption).toHaveClass("bg-blue-500", "text-white");
      });
    });

    it("applies hover style to non-selected options", async () => {
      render(<CommandPalette />);
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveClass("hover:bg-neutral-100");
    });
  });

  describe("Event Listener Cleanup", () => {
    it("removes event listener on unmount", () => {
      const removeSpy = jest.spyOn(window, "removeEventListener");
      const { unmount } = render(<CommandPalette />);
      unmount();
      expect(removeSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );
      removeSpy.mockRestore();
    });
  });
});
