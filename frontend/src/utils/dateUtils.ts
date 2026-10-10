export const formatDisplayDateTime = (val?: string | null): string => {
  if (!val) return "dd/mm/yyyy --:--";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "dd/mm/yyyy --:--";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return "dd/mm/yyyy --:--";
  }
};
