import { render, screen } from "@testing-library/react";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("renders the title, description, and action when provided", () => {
    render(
      <EmptyState
        action={<button type="button">Create route</button>}
        description="There are no active routes yet."
        title="No routes"
      />
    );

    expect(screen.getByText("No routes")).toBeInTheDocument();
    expect(screen.getByText("There are no active routes yet.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create route/i })).toBeInTheDocument();
  });

  it("omits optional slots when they are not provided", () => {
    render(<EmptyState title="No alerts" />);

    expect(screen.getByText("No alerts")).toBeInTheDocument();
    expect(screen.queryByText("There are no active routes yet.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
