/**
 * Tests for the Settings page appearance and API configuration controls.
 *
 * Coverage targets:
 *  - Theme selection writes the documented storage key ("stableroute.theme")
 *  - Resolved API base from src/lib/config.ts is displayed
 *  - AppearancePreview region updates its data-resolved-theme when the
 *    stored theme changes (simulated via a storage event)
 *  - Edge cases: env override, unknown storage value, storage unavailable
 */

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import SettingsPage from "./page";
import { DEFAULT_API_BASE } from "@/lib/config";

// ---------------------------------------------------------------------------
// Global test-environment setup
// ---------------------------------------------------------------------------

/** Stub matchMedia so effectiveTheme("system") resolves to "light" by default. */
function stubMatchMedia(prefersDark = false) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: prefersDark,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

beforeEach(() => {
  stubMatchMedia();
  window.localStorage.clear();
  // Reset env to default between tests
  delete process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;
});

// ---------------------------------------------------------------------------
// Existing smoke tests (kept for non-regression)
// ---------------------------------------------------------------------------

describe("SettingsPage — smoke", () => {
  it("renders the Settings heading", () => {
    render(<SettingsPage />);
    expect(
      screen.getByRole("heading", { name: /settings/i }),
    ).toBeInTheDocument();
  });

  it("renders all three ThemeToggle buttons", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("button", { name: /^light$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^dark$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^system$/i })).toBeInTheDocument();
  });

  it("renders the appearance preview section", () => {
    render(<SettingsPage />);
    expect(screen.getByText(/appearance preview/i)).toBeInTheDocument();
    expect(screen.getByText(/sample text/i)).toBeInTheDocument();
  });

  it("renders the API base card heading", () => {
    render(<SettingsPage />);
    expect(screen.getByText(/api base/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Theme selection → localStorage write
// ---------------------------------------------------------------------------

describe("SettingsPage — theme selection writes localStorage", () => {
  const STORAGE_KEY = "stableroute.theme";

  it("clicking Light writes 'light' under the documented storage key", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^light$/i }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("light");
  });

  it("clicking Dark writes 'dark' under the documented storage key", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^dark$/i }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  it("clicking System writes 'system' under the documented storage key", () => {
    render(<SettingsPage />);
    // First set something else so the system click is a genuine change
    fireEvent.click(screen.getByRole("button", { name: /^dark$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^system$/i }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("system");
  });

  it("does NOT write to any other storage key", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^dark$/i }));
    // Only the documented key should exist
    expect(window.localStorage.length).toBe(1);
    expect(window.localStorage.key(0)).toBe(STORAGE_KEY);
  });

  it("overwriting the theme with a new selection updates the stored value", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^light$/i }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("light");

    fireEvent.click(screen.getByRole("button", { name: /^dark$/i }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  it("aria-pressed reflects the active selection", () => {
    render(<SettingsPage />);
    const lightBtn = screen.getByRole("button", { name: /^light$/i });
    const darkBtn = screen.getByRole("button", { name: /^dark$/i });

    fireEvent.click(lightBtn);
    expect(lightBtn).toHaveAttribute("aria-pressed", "true");
    expect(darkBtn).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(darkBtn);
    expect(darkBtn).toHaveAttribute("aria-pressed", "true");
    expect(lightBtn).toHaveAttribute("aria-pressed", "false");
  });
});

// ---------------------------------------------------------------------------
// API base display
// ---------------------------------------------------------------------------

describe("SettingsPage — API base display", () => {
  it("shows the default API base when no env var is set", () => {
    render(<SettingsPage />);
    expect(screen.getByTestId("api-base-value")).toHaveTextContent(
      DEFAULT_API_BASE,
    );
  });

  it("shows the env-override URL when NEXT_PUBLIC_STABLEROUTE_API_BASE is set", () => {
    process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE = "https://api.staging.example.test";
    render(<SettingsPage />);
    expect(screen.getByTestId("api-base-value")).toHaveTextContent(
      "https://api.staging.example.test",
    );
  });

  it("strips a trailing slash from the displayed URL", () => {
    process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE = "https://api.example.test/";
    render(<SettingsPage />);
    expect(screen.getByTestId("api-base-value")).toHaveTextContent(
      "https://api.example.test",
    );
    expect(screen.getByTestId("api-base-value").textContent).not.toMatch(/\/$/);
  });

  it("renders the API base value in a monospace element", () => {
    render(<SettingsPage />);
    const el = screen.getByTestId("api-base-value");
    expect(el.tagName.toLowerCase()).toBe("p");
    expect(el.className).toMatch(/font-mono/);
  });
});

// ---------------------------------------------------------------------------
// AppearancePreview — updates with theme selection
// ---------------------------------------------------------------------------

describe("SettingsPage — AppearancePreview updates with theme", () => {
  it("resolves to 'light' by default when matchMedia returns false", () => {
    stubMatchMedia(false);
    render(<SettingsPage />);
    const preview = screen.getByTestId("appearance-preview");
    expect(preview).toHaveAttribute("data-resolved-theme", "light");
  });

  it("resolves to 'dark' when the dark button is clicked", async () => {
    // AppearancePreview reads theme via a storage event listener, not from
    // shared React state with ThemeToggle. In jsdom, writing to localStorage
    // from the same window does NOT fire the storage event automatically
    // (that only happens across different tabs/windows). We therefore write
    // the value to storage and dispatch the event explicitly, matching the
    // real cross-tab path that AppearancePreview is designed to handle.
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^dark$/i }));
    // ThemeToggle wrote "dark" to localStorage; propagate to AppearancePreview.
    act(() => {
      window.dispatchEvent(new Event("storage"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("appearance-preview")).toHaveAttribute(
        "data-resolved-theme",
        "dark",
      ),
    );
  });

  it("resolves to 'light' when the light button is clicked", async () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^dark$/i }));
    act(() => { window.dispatchEvent(new Event("storage")); });
    fireEvent.click(screen.getByRole("button", { name: /^light$/i }));
    act(() => { window.dispatchEvent(new Event("storage")); });
    await waitFor(() =>
      expect(screen.getByTestId("appearance-preview")).toHaveAttribute(
        "data-resolved-theme",
        "light",
      ),
    );
  });

  it("resolves to 'dark' for system theme when OS prefers dark", async () => {
    stubMatchMedia(true); // simulate prefers-color-scheme: dark
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^system$/i }));
    // system → effectiveTheme reads matchMedia → "dark"
    await waitFor(() =>
      expect(screen.getByTestId("appearance-preview")).toHaveAttribute(
        "data-resolved-theme",
        "dark",
      ),
    );
  });

  it("resolves to 'light' for system theme when OS prefers light", async () => {
    stubMatchMedia(false);
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /^system$/i }));
    await waitFor(() =>
      expect(screen.getByTestId("appearance-preview")).toHaveAttribute(
        "data-resolved-theme",
        "light",
      ),
    );
  });

  it("preview updates when a storage event fires with a new theme", async () => {
    render(<SettingsPage />);
    // Simulate another tab writing 'dark' to localStorage and firing the event
    window.localStorage.setItem("stableroute.theme", "dark");
    act(() => {
      window.dispatchEvent(new Event("storage"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("appearance-preview")).toHaveAttribute(
        "data-resolved-theme",
        "dark",
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("SettingsPage — edge cases", () => {
  it("falls back to system when localStorage contains an unknown theme value", async () => {
    stubMatchMedia(false); // system → light
    window.localStorage.setItem("stableroute.theme", "sepia"); // invalid value
    render(<SettingsPage />);
    // readTheme returns "system" for unknown values → resolves to "light"
    await waitFor(() =>
      expect(screen.getByTestId("appearance-preview")).toHaveAttribute(
        "data-resolved-theme",
        "light",
      ),
    );
  });

  it("still renders when localStorage is unavailable", () => {
    // Simulate a storage-access error (e.g. third-party cookie blocking)
    const originalGetItem = Storage.prototype.getItem;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.getItem = () => { throw new Error("storage blocked"); };
    Storage.prototype.setItem = () => { throw new Error("storage blocked"); };

    expect(() => render(<SettingsPage />)).not.toThrow();

    Storage.prototype.getItem = originalGetItem;
    Storage.prototype.setItem = originalSetItem;
  });

  it("does not crash when the Refresh button is clicked while router status is loading", () => {
    render(<SettingsPage />);
    const refreshBtn = screen.getByRole("button", { name: /refresh/i });
    expect(() => fireEvent.click(refreshBtn)).not.toThrow();
  });
});