import { render, screen, waitFor } from "@testing-library/react";
import AdminPage from "./page";

const mockFetch = (data: unknown) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(JSON.stringify(data)),
  } as unknown as Response);
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("AdminPage semantics", () => {
  it("exposes one main landmark and one page heading", async () => {
    mockFetch({ paused: false });
    render(<AdminPage />);

    expect(document.querySelectorAll("#main-content")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1, name: /admin/i })).toHaveLength(1);
    await screen.findByText("Live");
  });

  it("names the pause status panel with an accessible region", async () => {
    mockFetch({ paused: true });
    render(<AdminPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: /router pause status/i }),
      ).toBeInTheDocument();
    });
  });
});
