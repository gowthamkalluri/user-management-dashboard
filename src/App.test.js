import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders user management dashboard", () => {
  render(<App />);
  expect(screen.getByText(/user management dashboard/i)).toBeInTheDocument();
});
