import { render, screen } from "@testing-library/react";
import SettingsPage from "./page";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

describe("SettingsPage", () => {
  it("renders the heading", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("heading", { name: /settings/i })).toBeInTheDocument();
  });

  it("renders the ThemeToggle buttons", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("button", { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /system/i })).toBeInTheDocument();
  });

  it("renders the appearance preview section", () => {
    render(<SettingsPage />);
    expect(screen.getByText(/appearance preview/i)).toBeInTheDocument();
    expect(screen.getByText(/sample text/i)).toBeInTheDocument();
  });

  it("renders the API base row with default or env value", () => {
    render(<SettingsPage />);
    expect(screen.getByText(/api base/i)).toBeInTheDocument();
    expect(screen.getByText(/http:\/\/localhost:3001/)).toBeInTheDocument();
  });
});
