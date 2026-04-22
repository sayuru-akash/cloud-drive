import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewFolderDialog } from "./new-folder-dialog";

describe("NewFolderDialog", () => {
  it("does not render when closed", () => {
    const { container } = render(
      <NewFolderDialog open={false} onClose={vi.fn()} onConfirm={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders when open", () => {
    render(<NewFolderDialog open={true} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText("New folder")).toBeInTheDocument();
  });

  it("calls onClose when cancel button is clicked", () => {
    const onClose = vi.fn();
    render(<NewFolderDialog open={true} onClose={onClose} onConfirm={vi.fn()} />);

    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(<NewFolderDialog open={true} onClose={onClose} onConfirm={vi.fn()} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("submits folder name and visibility on confirm", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<NewFolderDialog open={true} onClose={vi.fn()} onConfirm={onConfirm} />);

    const input = screen.getByPlaceholderText("Folder name");
    await userEvent.clear(input);
    await userEvent.type(input, "My Folder");

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "workspace" } });

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("My Folder", "workspace");
    });
  });

  it("disables create button when name is empty", () => {
    render(<NewFolderDialog open={true} onClose={vi.fn()} onConfirm={vi.fn()} />);
    const createButton = screen.getByText("Create");
    expect(createButton).toBeDisabled();
  });

  it("trims whitespace from folder name", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<NewFolderDialog open={true} onClose={vi.fn()} onConfirm={onConfirm} />);

    const input = screen.getByPlaceholderText("Folder name");
    await userEvent.type(input, "  Test  ");

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("Test", "private");
    });
  });

  it("does not submit when name is only whitespace", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<NewFolderDialog open={true} onClose={vi.fn()} onConfirm={onConfirm} />);

    const input = screen.getByPlaceholderText("Folder name");
    await userEvent.type(input, "   ");

    fireEvent.click(screen.getByText("Create"));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("disables inputs while pending", async () => {
    const onConfirm = vi.fn(() => new Promise<void>(() => {}));
    render(<NewFolderDialog open={true} onClose={vi.fn()} onConfirm={onConfirm} />);

    const input = screen.getByPlaceholderText("Folder name");
    await userEvent.type(input, "Pending Test");

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(input).toBeDisabled();
    });
  });
});
