import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { apiPost } from "../../../lib/apiClient";
import NewPairPage from "./page";

// Mock app navigation so the redirect can be asserted without changing routes.
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock the shared API client at the page boundary.
jest.mock("../../../lib/apiClient", () => ({
  apiPost: jest.fn(),
}));

const push = jest.fn();
const mockUseRouter = useRouter as jest.Mock;
const mockApiPost = apiPost as jest.MockedFunction<typeof apiPost>;

function fillPairForm(source: string, destination: string) {
  fireEvent.change(screen.getByLabelText("Source"), {
    target: { value: source },
  });
  fireEvent.change(screen.getByLabelText("Destination"), {
    target: { value: destination },
  });
}

describe("NewPairPage", () => {
  beforeEach(() => {
    push.mockReset();
    mockApiPost.mockReset();
    mockUseRouter.mockReturnValue({ push });
  });

  it("renders the new pair form", () => {
    render(<NewPairPage />);

    expect(screen.getByRole("heading", { name: "New pair" })).toBeInTheDocument();
    expect(screen.getByLabelText("Source")).toBeInTheDocument();
    expect(screen.getByLabelText("Destination")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register pair" })).toBeInTheDocument();
  });

  it("blocks identical source and destination without posting", async () => {
    render(<NewPairPage />);

    fillPairForm("USDC", "USDC");
    fireEvent.click(screen.getByRole("button", { name: "Register pair" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Source and destination must differ."
    );
    expect(mockApiPost).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("posts the pair and redirects to the pairs page on success", async () => {
    mockApiPost.mockResolvedValueOnce(undefined);
    render(<NewPairPage />);

    fillPairForm("USDC", "EURC");
    fireEvent.click(screen.getByRole("button", { name: "Register pair" }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/api/v1/pairs", {
        source: "USDC",
        destination: "EURC",
      });
    });
    expect(push).toHaveBeenCalledWith("/pairs");
  });

  it("surfaces server errors without redirecting", async () => {
    mockApiPost.mockRejectedValueOnce(new Error("pair already exists"));
    render(<NewPairPage />);

    fillPairForm("USDC", "EURC");
    fireEvent.click(screen.getByRole("button", { name: "Register pair" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("pair already exists");
    expect(push).not.toHaveBeenCalled();
  });

  it("disables the submit button while saving", async () => {
    let resolvePost!: () => void;
    mockApiPost.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolvePost = resolve;
      })
    );
    render(<NewPairPage />);

    fillPairForm("USDC", "EURC");
    fireEvent.click(screen.getByRole("button", { name: "Register pair" }));

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();

    await act(async () => {
      resolvePost();
    });

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/pairs");
    });
    expect(screen.getByRole("button", { name: "Register pair" })).not.toBeDisabled();
  });
});
