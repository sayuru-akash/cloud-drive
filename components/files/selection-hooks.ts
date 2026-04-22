"use client";

import { useCallback, useMemo, useState } from "react";

export type SelectableItem = {
  id: string;
  type: "file" | "folder";
};

export function useSelection(items: SelectableItem[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const itemIds = useMemo(() => items.map((i) => i.id), [items]);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds],
  );

  const toggle = useCallback(
    (id: string, shiftKey?: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (shiftKey && lastSelectedId) {
          const startIndex = itemIds.indexOf(lastSelectedId);
          const endIndex = itemIds.indexOf(id);
          if (startIndex !== -1 && endIndex !== -1) {
            const [min, max] =
              startIndex < endIndex
                ? [startIndex, endIndex]
                : [endIndex, startIndex];
            for (let i = min; i <= max; i++) {
              next.add(itemIds[i]);
            }
            return next;
          }
        }
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      setLastSelectedId(id);
    },
    [itemIds, lastSelectedId],
  );

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(itemIds));
    setLastSelectedId(itemIds[itemIds.length - 1] ?? null);
  }, [itemIds]);

  const clearAll = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, []);

  const selectOne = useCallback((id: string) => {
    setSelectedIds(new Set([id]));
    setLastSelectedId(id);
  }, []);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds],
  );

  const selectedCount = selectedIds.size;

  const selectedFileIds = useMemo(
    () => selectedItems.filter((i) => i.type === "file").map((i) => i.id),
    [selectedItems],
  );

  const selectedFolderIds = useMemo(
    () => selectedItems.filter((i) => i.type === "folder").map((i) => i.id),
    [selectedItems],
  );

  return {
    selectedIds,
    isSelected,
    toggle,
    selectAll,
    clearAll,
    selectOne,
    selectedItems,
    selectedCount,
    selectedFileIds,
    selectedFolderIds,
  };
}
