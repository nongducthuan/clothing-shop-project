export type ReturnSelectedItems = Record<number | string, { selected: boolean; return_quantity: string | number }>;

/**
 * Chọn sản phẩm + số lượng trả (dùng chung cho ReturnFormStep và ReturnRequestModal).
 * Khác biệt giữa hai nơi dùng chỉ là cách ghi state → truyền qua `onChange(nextSelectedItems)`.
 */
export default function useReturnItemSelection(
  selectedItems: ReturnSelectedItems,
  onChange: (nextSelectedItems: ReturnSelectedItems) => void
) {
  const handleToggleItem = (itemId: number, maxQty: number, forceFullQty: boolean = false) => {
    const current = selectedItems[itemId] || { selected: false, return_quantity: maxQty };
    const nextSelected = !current.selected;
    onChange({
      ...selectedItems,
      [itemId]: {
        selected: nextSelected,
        return_quantity: nextSelected
          ? (forceFullQty ? maxQty : (current.return_quantity || maxQty))
          : maxQty
      }
    });
  };

  const handleQtyChange = (itemId: number, rawVal: string, maxQty: number) => {
    if (rawVal === "") {
      onChange({
        ...selectedItems,
        [itemId]: { ...selectedItems[itemId], selected: true, return_quantity: "" }
      });
      return;
    }
    const val = parseInt(rawVal, 10);
    if (isNaN(val)) return;
    const validQty = Math.min(val, maxQty);
    onChange({
      ...selectedItems,
      [itemId]: { ...selectedItems[itemId], selected: true, return_quantity: validQty < 1 ? "" : validQty }
    });
  };

  const handleQtyBlur = (itemId: number) => {
    const current = selectedItems[itemId]?.return_quantity;
    if (!current || Number(current) < 1) {
      onChange({
        ...selectedItems,
        [itemId]: { ...selectedItems[itemId], selected: true, return_quantity: 1 }
      });
    }
  };

  return { handleToggleItem, handleQtyChange, handleQtyBlur };
}
