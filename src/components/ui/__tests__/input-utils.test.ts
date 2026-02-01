import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  debounce,
  filterOptions,
  getSelectedIndex,
  isEmpty,
  highlightSearchText,
  KeyboardEvents,
} from '../input-utils';

describe('Input Utilities', () => {
  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('delays function execution', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 500);

      debounced('test');
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      expect(fn).toHaveBeenCalledWith('test');
    });

    it('cancels previous execution on subsequent calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 500);

      debounced('first');
      vi.advanceTimersByTime(300);

      debounced('second');
      vi.advanceTimersByTime(300);

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(200);
      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith('second');
    });

    it('handles multiple arguments', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 500);

      debounced('arg1', 'arg2', 42);

      vi.advanceTimersByTime(500);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 42);
    });

    it('executes debounced function', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 500);

      debounced('test');

      vi.advanceTimersByTime(500);
      expect(fn).toHaveBeenCalledWith('test');
    });

    it('respects custom delay', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 300);

      debounced('test');
      vi.advanceTimersByTime(299);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalled();
    });
  });

  describe('filterOptions', () => {
    const options = [
      { label: 'React', value: 'react' },
      { label: 'Vue', value: 'vue' },
      { label: 'Angular', value: 'angular' },
      { label: 'Svelte', value: 'svelte' },
    ];

    it('returns all options for empty query', () => {
      expect(filterOptions(options, '')).toEqual(options);
    });

    it('filters options by label', () => {
      const result = filterOptions(options, 'React');
      expect(result).toEqual([{ label: 'React', value: 'react' }]);
    });

    it('is case-insensitive', () => {
      const result = filterOptions(options, 'react');
      expect(result).toEqual([{ label: 'React', value: 'react' }]);
    });

    it('filters partial matches', () => {
      const result = filterOptions(options, 'Vue');
      expect(result).toEqual([{ label: 'Vue', value: 'vue' }]);
    });

    it('trims whitespace from query', () => {
      const result = filterOptions(options, '  React  ');
      expect(result).toEqual([{ label: 'React', value: 'react' }]);
    });

    it('returns empty array for non-matching query', () => {
      const result = filterOptions(options, 'Python');
      expect(result).toEqual([]);
    });

    it('returns empty array for empty options', () => {
      const result = filterOptions([], 'React');
      expect(result).toEqual([]);
    });

    it('handles partial text matching', () => {
      const result = filterOptions(options, 'ar');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].label).toContain('ar');
    });
  });

  describe('getSelectedIndex', () => {
    const options = ['react', 'vue', 'angular', 'svelte'];

    it('returns index of selected option', () => {
      expect(getSelectedIndex(options, 'react')).toBe(0);
      expect(getSelectedIndex(options, 'vue')).toBe(1);
      expect(getSelectedIndex(options, 'angular')).toBe(2);
      expect(getSelectedIndex(options, 'svelte')).toBe(3);
    });

    it('returns -1 for non-matching value', () => {
      expect(getSelectedIndex(options, 'python')).toBe(-1);
    });

    it('returns -1 for empty array', () => {
      expect(getSelectedIndex([], 'react')).toBe(-1);
    });

    it('handles null or undefined values', () => {
      expect(getSelectedIndex(options, null)).toBe(-1);
      expect(getSelectedIndex(options, undefined)).toBe(-1);
    });

    it('works with simple types', () => {
      const options = [10, 20, 30, 40];
      expect(getSelectedIndex(options, 20)).toBe(1);
    });
  });

  describe('isEmpty', () => {
    it('returns true for empty string', () => {
      expect(isEmpty('')).toBe(true);
    });

    it('returns true for null', () => {
      expect(isEmpty(null)).toBe(true);
    });

    it('returns true for undefined', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it('returns true for whitespace string', () => {
      expect(isEmpty('   ')).toBe(true);
    });

    it('returns true for tab string', () => {
      expect(isEmpty('\t\t')).toBe(true);
    });

    it('returns false for non-empty string', () => {
      expect(isEmpty('react')).toBe(false);
    });

    it('returns false for string with content', () => {
      expect(isEmpty(' content ')).toBe(false);
    });

    it('returns false for zero string', () => {
      expect(isEmpty('0')).toBe(false);
    });
  });

  describe('highlightSearchText', () => {
    it('highlights matching text', () => {
      const result = highlightSearchText('React Framework', 'React');
      expect(result).toContain('<mark>React</mark>');
    });

    it('is case-insensitive', () => {
      const result = highlightSearchText('React Framework', 'react');
      expect(result).toContain('<mark>');
    });

    it('highlights all occurrences', () => {
      const result = highlightSearchText('Test test TEST', 'test');
      const matches = (result.match(/<mark>/g) || []).length;
      expect(matches).toBe(3);
    });

    it('returns original text for empty query', () => {
      const text = 'React Framework';
      expect(highlightSearchText(text, '')).toBe(text);
    });

    it('returns original text for non-matching query', () => {
      const text = 'React Framework';
      expect(highlightSearchText(text, 'Python')).toBe(text);
    });

    it('handles multiple word text', () => {
      const result = highlightSearchText('Python Programming Language', 'Python');
      expect(result).toContain('<mark>Python</mark>');
    });

    it('preserves surrounding text', () => {
      const result = highlightSearchText('Hello React World', 'React');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });
  });

  describe('KeyboardEvents', () => {
    it('identifies Enter key', () => {
      expect(KeyboardEvents.isEnter('Enter')).toBe(true);
      expect(KeyboardEvents.isEnter('Space')).toBe(false);
    });

    it('identifies Escape key', () => {
      expect(KeyboardEvents.isEscape('Escape')).toBe(true);
      expect(KeyboardEvents.isEscape('Enter')).toBe(false);
    });

    it('identifies Space key', () => {
      expect(KeyboardEvents.isSpace(' ')).toBe(true);
      expect(KeyboardEvents.isSpace('Spacebar')).toBe(true);
      expect(KeyboardEvents.isSpace('Space')).toBe(false);
    });

    it('identifies ArrowDown key', () => {
      expect(KeyboardEvents.isArrowDown('ArrowDown')).toBe(true);
      expect(KeyboardEvents.isArrowDown('ArrowUp')).toBe(false);
    });

    it('identifies ArrowUp key', () => {
      expect(KeyboardEvents.isArrowUp('ArrowUp')).toBe(true);
      expect(KeyboardEvents.isArrowUp('ArrowDown')).toBe(false);
    });

    it('identifies Tab key', () => {
      expect(KeyboardEvents.isTab('Tab')).toBe(true);
      expect(KeyboardEvents.isTab('Enter')).toBe(false);
    });

    it('is case-sensitive', () => {
      expect(KeyboardEvents.isEnter('enter')).toBe(false);
      expect(KeyboardEvents.isEscape('escape')).toBe(false);
    });

    it('handles all keyboard helpers', () => {
      const allHelpers = Object.keys(KeyboardEvents);
      expect(allHelpers).toContain('isEnter');
      expect(allHelpers).toContain('isEscape');
      expect(allHelpers).toContain('isSpace');
      expect(allHelpers).toContain('isArrowDown');
      expect(allHelpers).toContain('isArrowUp');
      expect(allHelpers).toContain('isTab');
    });
  });

  describe('Edge Cases', () => {
    it('debounce handles rapid successive calls', () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      for (let i = 0; i < 10; i++) {
        debounced(i);
        vi.advanceTimersByTime(50);
      }

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith(9);

      vi.useRealTimers();
    });

    it('filterOptions preserves order', () => {
      const options = [
        { label: 'Z Framework', value: 'z' },
        { label: 'A Framework', value: 'a' },
        { label: 'M Framework', value: 'm' },
      ];

      const result = filterOptions(options, 'Framework');
      expect(result[0].label).toBe('Z Framework');
      expect(result[1].label).toBe('A Framework');
      expect(result[2].label).toBe('M Framework');
    });

    it('highlightSearchText handles empty input', () => {
      expect(highlightSearchText('', '')).toBe('');
      expect(highlightSearchText('', 'query')).toBe('');
    });
  });
});
