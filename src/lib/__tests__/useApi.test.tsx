import { act, render, screen, waitFor } from "@testing-library/react";
import { useApi } from "../useApi";

function Probe({ path }: { path: string | null }) {
  const state = useApi<{ value: string }>(path);

  if (state.status === "loading") return <p role="status">Loading</p>;
  if (state.status === "error") return <p role="alert">{state.error}</p>;
  return <p>{state.data.value}</p>;
}

function jsonResponse(body: unknown, init: Partial<Response> = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  } as unknown as Response;
}

afterEach(() => jest.restoreAllMocks());

it("loads data and exposes ok state", async () => {
  globalThis.fetch = jest
    .fn()
    .mockResolvedValue(jsonResponse({ value: "ready" }));

  render(<Probe path="/api/v1/demo" />);

  expect(screen.getByRole("status")).toHaveTextContent("Loading");
  expect(await screen.findByText("ready")).toBeInTheDocument();
});

it("surfaces API failures as error state", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue(
    jsonResponse(
      { error: "bad_request", message: "request failed" },
      { ok: false, status: 400 }
    )
  );

  render(<Probe path="/api/v1/demo" />);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "request failed"
  );
});

it("does not fetch when path is null", () => {
  globalThis.fetch = jest.fn();

  render(<Probe path={null} />);

  expect(screen.getByRole("status")).toHaveTextContent("Loading");
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

it("does not update state after unmounting an in-flight request", async () => {
  let resolveFetch!: (value: Response) => void;
  const fetchPromise = new Promise<Response>((resolve) => {
    resolveFetch = resolve;
  });
  const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);
  globalThis.fetch = jest.fn().mockReturnValue(fetchPromise);

  const { unmount } = render(<Probe path="/api/v1/demo" />);
  unmount();

  await act(async () => {
    resolveFetch(jsonResponse({ value: "late" }));
    await fetchPromise;
  });

  await waitFor(() => {
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
