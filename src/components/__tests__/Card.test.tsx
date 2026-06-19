import { render, screen } from "@testing-library/react";
import { Card } from "../Card";

describe("Card", () => {
  it("renders title and body", () => {
    render(<Card title="t-title">body-text</Card>);
    expect(screen.getByText(/t-title/)).toBeInTheDocument();
    expect(screen.getByText(/body-text/)).toBeInTheDocument();
  });

  it("renders the footer when provided", () => {
    render(
      <Card title="t" footer={<span>foot</span>}>
        body
      </Card>
    );
    expect(screen.getByText(/foot/)).toBeInTheDocument();
  });

  it("omits optional regions and forwards div props", () => {
    render(
      <Card className="shadow-sm" data-testid="card-shell">
        body
      </Card>
    );

    const card = screen.getByTestId("card-shell");
    expect(card.className).toMatch(/shadow-sm/);
    expect(card.querySelector("header")).not.toBeInTheDocument();
    expect(card.querySelector("footer")).not.toBeInTheDocument();
  });
});
