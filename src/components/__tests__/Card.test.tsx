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
});
