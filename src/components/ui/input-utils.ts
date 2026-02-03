/**
 * Input Utility Functions
 * Shared utilities for input and search components
 */

/**
 * Debounce function that delays function execution
 * @param func - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Filter options based on search query
 * @param options - Array of options with label and value
 * @param query - Search query string
 * @returns Filtered options
 */
export function filterOptions<T extends { label: string; value: any }>(
  options: T[],
  query: string
): T[] {
  if (!query.trim()) {
    return options;
  }

  const lowerQuery = query.toLowerCase().trim();
  return options.filter((option) =>
    option.label.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get index of selected option in array
 * @param options - Array of option values
 * @param selectedValue - Currently selected value
 * @returns Index of selected option or -1 if not found
 */
export function getSelectedIndex(
  options: any[],
  selectedValue: any
): number {
  return options.findIndex((opt) => opt === selectedValue);
}

/**
 * Check if input is empty
 * @param value - Input value
 * @returns True if value is empty/falsy
 */
export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

/**
 * Highlight matching text in search results
 * @param text - Full text
 * @param query - Search query
 * @returns Text with query highlighted
 */
export function highlightSearchText(text: string, query: string): string {
  if (!query.trim()) {
    return text;
  }

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Keyboard event helpers
 */
export const KeyboardEvents = {
  /** Check if key is Enter */
  isEnter: (key: string): boolean => key === 'Enter',

  /** Check if key is Escape */
  isEscape: (key: string): boolean => key === 'Escape',

  /** Check if key is Space */
  isSpace: (key: string): boolean => key === ' ' || key === 'Spacebar',

  /** Check if key is Arrow Down */
  isArrowDown: (key: string): boolean => key === 'ArrowDown',

  /** Check if key is Arrow Up */
  isArrowUp: (key: string): boolean => key === 'ArrowUp',

  /** Check if key is Tab */
  isTab: (key: string): boolean => key === 'Tab',
} as const;

