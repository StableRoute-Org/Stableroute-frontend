import { render, screen } from "@testing-library/react";
import { StatTile } from "../StatTile";

describe("StatTile", () => {
  it("renders a label and value with description-list semantics", () => {
    render(<StatTile label="Volume" value="1,234" />);
    const term = screen.getByText("Volume");
    const def = screen.getByText("1,234");
    expect(term.tagName).toBe("DT");
    expect(def.tagName).toBe("DD");
  });

  it("does not render a delta indicator when neither delta nor trend is supplied", () => {
    const { container } = render(<StatTile label="Volume" value="1,234" />);
    expect(container.querySelector("[aria-label]")).toBeNull();
  });

  it("renders an up indicator for a positive delta with a plus sign", () => {
    render(<StatTile label="Volume" value="1,234" delta={12.3} />);
    // The aria-label is the full sentence; the visible sign is "+12.3".
    const indicator = screen.getByLabelText(/Volume increased by 12\.3/i);
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent(/\+12\.3/);
  });

  it("renders a down indicator for a negative delta with a minus sign", () => {
    render(<StatTile label="Errors" value="3" delta={-2.5} />);
    const indicator = screen.getByLabelText(/Errors decreased by 2\.5/i);
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent(/-2\.5/);
  });

  it("renders a flat indicator for a zero delta", () => {
    render(<StatTile label="Latency" value="42ms" delta={0} />);
    const indicator = screen.getByLabelText(/Latency unchanged/i);
    expect(indicator).toBeInTheDocument();
  });

  it("honours a custom trend direction supplied via `trend`", () => {
    render(<StatTile label="Signups" value="5" trend="up" />);
    expect(screen.getByLabelText(/Signups increased/i)).toBeInTheDocument();
  });

  it("honours a custom deltaUnit suffix", () => {
    render(<StatTile label="Conversion" value="3.2%" delta={1.5} deltaUnit="%" />);
    const indicator = screen.getByLabelText(/Conversion increased by 1\.5%/i);
    expect(indicator).toHaveTextContent(/\+1\.5%/);
  });

  it("uses a custom delta formatter when provided", () => {
    const formatDelta = (n: number) => `${Math.abs(n).toFixed(0)} req/s`;
    render(<StatTile label="RPS" value="100" delta={42} formatDelta={formatDelta} />);
    expect(
      screen.getByLabelText(/RPS increased by 42 req\/s/i),
    ).toHaveTextContent(/\+42 req\/s/);
  });

  it("colour is not the only signal: every indicator carries an aria-label and a text alternative", () => {
    const { container } = render(<StatTile label="Revenue" value="$1,000" delta={15.5} />);
    const indicator = container.querySelector("[aria-label]");
    expect(indicator).not.toBeNull();
    expect(indicator!.getAttribute("aria-label")).toMatch(/increased/);
    // Visible text content (not just colour) is rendered in the DOM.
    expect(indicator!.textContent).toContain("+15.5");
  });

  it("hides the arrow glyph from screen readers via aria-hidden", () => {
    const { container } = render(<StatTile label="Volume" value="1,234" delta={5} />);
    const arrow = container.querySelector('[aria-hidden="true"]');
    expect(arrow).not.toBeNull();
    // The arrow is one of the three glyphs in TREND_STYLES (never the
    // visible numeric text), so screen readers will not announce it.
    expect(arrow!.textContent).toMatch(/[▲▼▬]/);
  });

  it("the visible numeric text is NOT inside the aria-hidden subtree", () => {
    const { container } = render(<StatTile label="Volume" value="1,234" delta={5} />);
    // The +5.0 must be a real text node that screen readers will read.
    const indicator = container.querySelector("[aria-label]");
    expect(indicator).not.toBeNull();
    // Walk the children: at least one direct child should not be aria-hidden.
    const visibleChild = Array.from(indicator!.children).find(
      (c) => c.getAttribute("aria-hidden") !== "true",
    );
    expect(visibleChild).not.toBeUndefined();
    expect(visibleChild!.textContent).toBe("+5.0");
  });
});
