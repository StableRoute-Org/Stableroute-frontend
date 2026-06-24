import { render, screen } from "@testing-library/react";
import SettingsPage from "./page";

describe("SettingsPage", () => {
  const originalEnv = process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;

  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
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

  afterEach(() => {
    process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE = originalEnv;
  });

  it("renders the API base from environment variables", () => {
    process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE = "https://api.stableroute.io";
    render(<SettingsPage />);
    expect(screen.getByText("https://api.stableroute.io")).toBeInTheDocument();
  });

  it("renders the default API base when environment variable is missing", () => {
    delete process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;
    render(<SettingsPage />);
    expect(screen.getByText("http://localhost:3001")).toBeInTheDocument();
  });

  it("renders the appearance preview section", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getAllByText("Sample surface text.")).toHaveLength(2);
  });

  it("renders the backend configuration section", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.getByText("API Configuration")).toBeInTheDocument();
  });
});
