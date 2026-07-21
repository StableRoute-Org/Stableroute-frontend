import { fireEvent, render, screen } from "@testing-library/react";
import RootLayout from "./layout";
import { useToast } from "@/components/ToastProvider";

// The root layout mounts <Header>, which calls usePathname() (needs the App
// Router context) and <ThemeToggle>, which resolves the "system" theme through
// window.matchMedia on mount. jsdom provides neither, so we stub both.
jest.mock("next/navigation");

function ToastHarness() {
  const { push } = useToast();
  return (
    <main id="main-content" tabIndex={-1}>
      <p>Harness page</p>
      <button type="button" onClick={() => push("layout-toast", "info")}>
        Trigger toast
      </button>
    </main>
  );
}

describe("RootLayout", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: jest.fn().mockReturnValue({ matches: false }),
    });
  });

  it("renders the skip link targeting the main content landmark", () => {
    render(
      <RootLayout>
        <main id="main-content">Child</main>
      </RootLayout>,
    );

    const skip = screen.getByRole("link", { name: /skip to main content/i });
    expect(skip).toHaveAttribute("href", "#main-content");
  });

  it("wraps children with Header above and Footer below", () => {
    render(
      <RootLayout>
        <main id="main-content">Child page</main>
      </RootLayout>,
    );

    expect(screen.getByRole("navigation", { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByText("Child page")).toBeInTheDocument();
    expect(
      screen.getByText("StableRoute — liquidity routing on Stellar."),
    ).toBeInTheDocument();
  });

  it("provides ToastProvider context to descendants", () => {
    render(
      <RootLayout>
        <ToastHarness />
      </RootLayout>,
    );

    fireEvent.click(screen.getByRole("button", { name: /trigger toast/i }));
    expect(screen.getByText("layout-toast")).toBeInTheDocument();
  });
});
