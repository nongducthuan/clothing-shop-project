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

/** Formats an ISO/Date string as `YYYY-MM-DDTHH:mm` in local time for `<input type="datetime-local">`. */
export const toLocalDateTimeInput = (val?: string | null): string => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${mins}`;
};

/** Converts a `<input type="datetime-local">` local string to a UTC ISO string for API payloads. */
export const fromLocalDateTimeInput = (val?: string | null): string | null => {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
};
