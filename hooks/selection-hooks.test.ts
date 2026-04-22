import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSelection } from "@/components/files/selection-hooks";

describe("useSelection", () => {
  const items = [
    { id: "a", type: "file" as const },
    { id: "b", type: "folder" as const },
    { id: "c", type: "file" as const },
    { id: "d", type: "folder" as const },
  ];

  it("starts with empty selection", () => {
    const { result } = renderHook(() => useSelection(items));
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isSelected("a")).toBe(false);
  });

  it("toggles item selection", () => {
    const { result } = renderHook(() => useSelection(items));

    act(() => result.current.toggle("a"));
    expect(result.current.isSelected("a")).toBe(true);
    expect(result.current.selectedCount).toBe(1);

    act(() => result.current.toggle("a"));
    expect(result.current.isSelected("a")).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it("selects range with shift+click", () => {
    const { result } = renderHook(() => useSelection(items));

    act(() => result.current.toggle("a"));
    act(() => result.current.toggle("c", true));

    expect(result.current.isSelected("a")).toBe(true);
    expect(result.current.isSelected("b")).toBe(true);
    expect(result.current.isSelected("c")).toBe(true);
    expect(result.current.isSelected("d")).toBe(false);
  });

  it("selects range backwards with shift+click", () => {
    const { result } = renderHook(() => useSelection(items));

    act(() => result.current.toggle("c"));
    act(() => result.current.toggle("a", true));

    expect(result.current.isSelected("a")).toBe(true);
    expect(result.current.isSelected("b")).toBe(true);
    expect(result.current.isSelected("c")).toBe(true);
    expect(result.current.isSelected("d")).toBe(false);
  });

  it("ignores shift+click when no last selected", () => {
    const { result } = renderHook(() => useSelection(items));

    act(() => result.current.toggle("b", true));
    expect(result.current.isSelected("b")).toBe(true);
    expect(result.current.selectedCount).toBe(1);
  });

  it("selects all items", () => {
    const { result } = renderHook(() => useSelection(items));

    act(() => result.current.selectAll());
    expect(result.current.selectedCount).toBe(4);
    expect(result.current.isSelected("d")).toBe(true);
  });

  it("clears all selections", () => {
    const { result } = renderHook(() => useSelection(items));

    act(() => result.current.selectAll());
    act(() => result.current.clearAll());
    expect(result.current.selectedCount).toBe(0);
  });

  it("selects one item exclusively", () => {
    const { result } = renderHook(() => useSelection(items));

    act(() => result.current.selectAll());
    act(() => result.current.selectOne("b"));
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected("b")).toBe(true);
    expect(result.current.isSelected("a")).toBe(false);
  });

  it("filters selected file ids", () => {
    const { result } = renderHook(() => useSelection(items));

    act(() => result.current.selectAll());
    expect(result.current.selectedFileIds).toEqual(["a", "c"]);
  });

  it("filters selected folder ids", () => {
    const { result } = renderHook(() => useSelection(items));

    act(() => result.current.selectAll());
    expect(result.current.selectedFolderIds).toEqual(["b", "d"]);
  });

  it("returns selected items with type info", () => {
    const { result } = renderHook(() => useSelection(items));

    act(() => result.current.toggle("b"));
    expect(result.current.selectedItems).toEqual([{ id: "b", type: "folder" }]);
  });

  it("handles empty items array", () => {
    const { result } = renderHook(() => useSelection([]));
    expect(result.current.selectedCount).toBe(0);
    act(() => result.current.selectAll());
    expect(result.current.selectedCount).toBe(0);
  });
});
