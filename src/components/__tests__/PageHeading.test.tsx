import { render, screen } from "@testing-library/react";
import { PageHeading } from "../PageHeading";

describe("PageHeading", () => {
  it("renders heading, description, and action content", () => {
    render(
      <PageHeading
        action={<a href="/quote">New quote</a>}
        description="Monitor bridge quotes in one place."
        title="Route dashboard"
      />
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /route dashboard/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Monitor bridge quotes in one place.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /new quote/i })).toHaveAttribute(
      "href",
      "/quote"
    );
  });

  it("renders only the heading when optional props are omitted", () => {
    render(<PageHeading title="Stats" />);

    expect(screen.getByRole("heading", { level: 1, name: /stats/i })).toBeInTheDocument();
    expect(screen.queryByText("Monitor bridge quotes in one place.")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
