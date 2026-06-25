import { render, screen } from "@testing-library/react";
import StatsPage from "./page";

const mockFetch = (data: unknown) =>
  jest.spyOn(globalThis, "fetch").mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    } as Response)
  );

afterEach(() => {
  jest.restoreAllMocks();
});

describe("StatsPage", () => {
  it("renders the heading", () => {
    mockFetch({ totalPairs: 0, paused: false });
    render(<StatsPage />);
    expect(screen.getByRole("heading", { name: /stats/i })).toBeInTheDocument();
  });

  it("formats totalPairs with thousands separators via formatNumber", async () => {
    mockFetch({ totalPairs: 1234567, paused: false });
    render(<StatsPage />);
    const pairs = await screen.findByText("1,234,567");
    expect(pairs).toBeInTheDocument();
  });

  it("renders Live when paused is false", async () => {
    mockFetch({ totalPairs: 0, paused: false });
    render(<StatsPage />);
    const status = await screen.findByText("Live");
    expect(status).toBeInTheDocument();
  });

  it("renders Paused when paused is true", async () => {
    mockFetch({ totalPairs: 0, paused: true });
    render(<StatsPage />);
    const status = await screen.findByText("Paused");
    expect(status).toBeInTheDocument();
  });

  it("renders error message on fetch failure", async () => {
    jest.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.reject(new Error("Network error"))
    );
    render(<StatsPage />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/network error/i);
  });
});
