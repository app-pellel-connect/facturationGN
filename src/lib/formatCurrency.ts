/**
 * Format a number as Guinean Franc (GNF)
 * Optimized for performance on low-end devices
 */
export function formatGNF(amount: number | null | undefined): string {
  if (amount == null) return '0 GNF';
  
  // Round to whole number (GNF doesn't use decimals)
  const rounded = Math.round(amount);
  
  // Format with thousands separator (space for French-speaking Guinea)
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  return `${formatted} GNF`;
}

/**
 * Format a number as Euro
 */
export function formatEuro(amount: number | null | undefined): string {
  if (amount == null) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
