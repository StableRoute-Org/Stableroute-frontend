import { render, screen } from "@testing-library/react";
import { TextField } from "../TextField";

describe("TextField", () => {
  it("associates the label with an auto-generated input id and forwards input props", () => {
    render(
      <TextField
        label="API key name"
        name="name"
        type="text"
        placeholder="Production key"
        defaultValue="prod"
        className="custom-field"
      />
    );

    const input = screen.getByLabelText("API key name");
    expect(input).toHaveAttribute("name", "name");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("placeholder", "Production key");
    expect(input).toHaveValue("prod");
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input.closest("label")).toHaveClass("custom-field");
  });

  it("references the description from aria-describedby", () => {
    render(<TextField label="Webhook URL" description="Must be an HTTPS endpoint." />);

    const input = screen.getByLabelText(/Webhook URL/);
    const description = screen.getByText("Must be an HTTPS endpoint.");

    expect(description.id).toBeTruthy();
    expect(input).toHaveAttribute("aria-describedby", description.id);
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("marks the input invalid and references the error alert", () => {
    render(<TextField label="Amount" error="Amount is required." />);

    const input = screen.getByLabelText(/Amount/);
    const error = screen.getByRole("alert");

    expect(error).toHaveTextContent("Amount is required.");
    expect(error.id).toBeTruthy();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", error.id);
  });

  it("uses a caller-supplied id and composes description and error ids in order", () => {
    render(
      <TextField
        id="pair-fee"
        label="Fee basis points"
        description="Enter a value between 0 and 1000."
        error="Fee must be a whole number."
        inputMode="numeric"
      />
    );

    const input = screen.getByLabelText(/Fee basis points/);
    const description = screen.getByText("Enter a value between 0 and 1000.");
    const error = screen.getByRole("alert");

    expect(input).toHaveAttribute("id", "pair-fee");
    expect(description).toHaveAttribute("id", "pair-fee-desc");
    expect(error).toHaveAttribute("id", "pair-fee-err");
    expect(input).toHaveAttribute("aria-describedby", "pair-fee-desc pair-fee-err");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("inputmode", "numeric");
  });
});
