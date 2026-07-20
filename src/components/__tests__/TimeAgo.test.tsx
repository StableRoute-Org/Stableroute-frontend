import { fireEvent, render, screen } from "@testing-library/react";
import { TimeAgo } from "../TimeAgo";

describe("TimeAgo", () => {
  it("toggles between relative and absolute labels on click", () => {
    const ts = Date.now() - 60_000;
    render(<TimeAgo ts={ts} />);
    const node = screen.getByText(/1m ago|just now/i);
    fireEvent.click(node);
    expect(node.textContent).toMatch(/202/i);
    fireEvent.click(node);
    expect(node.textContent).toMatch(/ago|just now/i);
  });
});
