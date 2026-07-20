import { render, screen, act } from "@testing-library/react";
import { ApiAuthGuard } from "../ApiAuthGuard";
import { ToastProvider } from "../ToastProvider";
import * as apiClient from "@/lib/apiClient";

function setup() {
  let handler: ((status: 401 | 403) => void) | null = null;
  const spy = jest
    .spyOn(apiClient, "registerAuthErrorHandler")
    .mockImplementation((cb) => {
      handler = cb;
      return () => {
        handler = null;
      };
    });
  return { spy, getHandler: () => handler };
}

describe("ApiAuthGuard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("registers an auth error handler on mount", () => {
    const { spy } = setup();
    render(
      <ToastProvider>
        <ApiAuthGuard />
      </ToastProvider>,
    );
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(expect.any(Function));
  });

  it("pushes a session-expired toast on 401", () => {
    const { getHandler } = setup();
    render(
      <ToastProvider>
        <ApiAuthGuard />
      </ToastProvider>,
    );

    act(() => {
      getHandler()?.(401);
    });

    expect(
      screen.getByText("Your session has expired. Please sign in again."),
    ).toBeInTheDocument();
  });

  it("pushes a permission-denied toast on 403", () => {
    const { getHandler } = setup();
    render(
      <ToastProvider>
        <ApiAuthGuard />
      </ToastProvider>,
    );

    act(() => {
      getHandler()?.(403);
    });

    expect(
      screen.getByText("You don't have permission to perform that action."),
    ).toBeInTheDocument();
  });

  it("unregisters the handler on unmount", () => {
    const { getHandler } = setup();
    const { unmount } = render(
      <ToastProvider>
        <ApiAuthGuard />
      </ToastProvider>,
    );

    expect(getHandler()).not.toBeNull();

    unmount();

    expect(getHandler()).toBeNull();
  });
});
