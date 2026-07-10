import { render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import RootLayout from "./layout";
import { useToast } from "@/components/ToastProvider";

function ToastContextProbe() {
  const { push } = useToast();

  return (
    <div data-testid="toast-context">
      {typeof push === "function" ? "available" : "missing"}
    </div>
  );
}

function getBodyChildren(children: ReactNode) {
  const layout = RootLayout({ children }) as ReactElement<{
    children: ReactElement<{ children: ReactNode }>;
  }>;

  return layout.props.children.props.children;
}

function renderLayout() {
  return render(
    <>
      {getBodyChildren(
        <main id="main-content" data-testid="layout-child">
          <ToastContextProbe />
        </main>,
      )}
    </>,
  );
}

describe("RootLayout", () => {
  it("renders the skip link pointing at the main content landmark target", () => {
    renderLayout();

    expect(
      screen.getByRole("link", { name: /skip to main content/i }),
    ).toHaveAttribute("href", "#main-content");
    expect(screen.getByTestId("layout-child")).toHaveAttribute(
      "id",
      "main-content",
    );
  });

  it("composes the global header before children and footer after children", () => {
    const { container } = renderLayout();

    const header = container.querySelector("header");
    const child = screen.getByTestId("layout-child");
    const footer = container.querySelector("footer");

    expect(header).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
    expect(
      header!.compareDocumentPosition(child) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      child.compareDocumentPosition(footer!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("makes the ToastProvider context available to layout children", () => {
    renderLayout();

    expect(screen.getByTestId("toast-context")).toHaveTextContent("available");
  });

  // RootLayout owns the document-level <html lang="en" dir="ltr"> and <body>
  // shell. React Testing Library mounts into jsdom's existing document body, so
  // renderLayout unwraps the body children and this suite focuses on the
  // rendered, testable layout composition instead of mounting document tags
  // directly.
});
