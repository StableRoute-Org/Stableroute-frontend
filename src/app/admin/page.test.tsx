import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { apiGet, apiPost } from "../../lib/apiClient";
import AdminPage from "./page";

// Mock the shared API client so tests can assert the operator endpoints.
jest.mock("../../lib/apiClient", () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

const mockApiGet = apiGet as jest.MockedFunction<typeof apiGet>;
const mockApiPost = apiPost as jest.MockedFunction<typeof apiPost>;

describe("AdminPage", () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockApiPost.mockReset();
  });

  it("renders the initial loading state before status resolves", async () => {
    let resolveStatus!: (value: { paused: boolean }) => void;
    mockApiGet.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStatus = resolve;
      })
    );

    render(<AdminPage />);

    expect(screen.getByText("Loading status…")).toBeInTheDocument();

    resolveStatus({ paused: false });
    expect(await screen.findByText("Live")).toBeInTheDocument();
  });

  it("renders live status with a Pause button", async () => {
    mockApiGet.mockResolvedValueOnce({ paused: false });

    render(<AdminPage />);

    expect(await screen.findByText("Live")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  it("renders paused status with an Unpause button", async () => {
    mockApiGet.mockResolvedValueOnce({ paused: true });

    render(<AdminPage />);

    expect(await screen.findByText("Paused")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unpause" })).toBeInTheDocument();
  });

  it("posts pause and reloads status after a successful live toggle", async () => {
    mockApiGet
      .mockResolvedValueOnce({ paused: false })
      .mockResolvedValueOnce({ paused: true });
    mockApiPost.mockResolvedValueOnce(undefined);

    render(<AdminPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Pause" }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/api/v1/admin/pause", {});
    });
    expect(await screen.findByText("Paused")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unpause" })).toBeInTheDocument();
  });

  it("posts unpause and reloads status after a successful paused toggle", async () => {
    mockApiGet
      .mockResolvedValueOnce({ paused: true })
      .mockResolvedValueOnce({ paused: false });
    mockApiPost.mockResolvedValueOnce(undefined);

    render(<AdminPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Unpause" }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/api/v1/admin/unpause", {});
    });
    expect(await screen.findByText("Live")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  it("surfaces status load errors", async () => {
    mockApiGet.mockRejectedValueOnce(new Error("status unavailable"));

    render(<AdminPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("status unavailable");
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("surfaces toggle errors without reloading status", async () => {
    mockApiGet.mockResolvedValueOnce({ paused: false });
    mockApiPost.mockRejectedValueOnce(new Error("toggle failed"));

    render(<AdminPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Pause" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("toggle failed");
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(mockApiGet).toHaveBeenCalledTimes(1);
  });
});
