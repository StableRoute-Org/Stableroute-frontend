import { render, screen } from "@testing-library/react";
import { RouteAnnouncer } from "../RouteAnnouncer";
import { usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

describe("RouteAnnouncer", () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue("/");
    // Mock main-content element
    document.body.innerHTML = '<main id="main-content" tabIndex={-1}></main>';
  });

  it("does not announce on initial load", () => {
    render(<RouteAnnouncer />);
    const announcer = screen.getByText("", { selector: ".sr-only" });
    expect(announcer).toBeEmptyDOMElement();
  });

  it("announces the page title on route change", () => {
    const { rerender } = render(<RouteAnnouncer />);
    
    (usePathname as jest.Mock).mockReturnValue("/pairs");
    rerender(<RouteAnnouncer />);
    
    expect(screen.getByText(/Pairs loaded\./i)).toBeInTheDocument();
  });

  it("moves focus to main-content on route change", () => {
    const mainContent = document.getElementById("main-content")!;
    jest.spyOn(mainContent, "focus");
    
    const { rerender } = render(<RouteAnnouncer />);
    
    (usePathname as jest.Mock).mockReturnValue("/pairs");
    rerender(<RouteAnnouncer />);
    
    expect(mainContent.focus).toHaveBeenCalled();
  });
});
