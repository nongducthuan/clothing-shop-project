/**
 * Formats a given amount into a localized currency string.
 * @param amount The numeric amount to format.
 * @param language The target language ('vi' or 'en'). Defaults to 'vi'.
 * @returns The formatted currency string.
 */
export const formatCurrency = (amount: number | string | null | undefined, language: string = 'vi'): string => {
  const validAmount = Number(amount) || 0;
  if (language === 'en') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
    }).format(validAmount);
  }
  
  return new Intl.NumberFormat('vi-VN').format(validAmount) + ' d';
};
