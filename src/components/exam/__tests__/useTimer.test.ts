import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useTimer } from '../hooks/useTimer';

describe('useTimer hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should initialize with correct values', () => {
    const { result } = renderHook(() => useTimer(300));

    expect(result.current.remaining).toBe(300);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.timeDisplay).toBe('00:05:00');
  });

  it('should decrement remaining time every second', async () => {
    const { result } = renderHook(() => useTimer(300));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.remaining).toBe(299);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.remaining).toBe(294);
  });

  it('should format time correctly', () => {
    const { result: result1 } = renderHook(() => useTimer(3661)); // 1h 1m 1s
    expect(result1.current.timeDisplay).toBe('01:01:01');

    const { result: result2 } = renderHook(() => useTimer(65)); // 1m 5s
    expect(result2.current.timeDisplay).toBe('00:01:05');

    const { result: result3 } = renderHook(() => useTimer(9)); // 9s
    expect(result3.current.timeDisplay).toBe('00:00:09');
  });

  it('should trigger onWarning at 5 minutes (300 seconds)', async () => {
    const onWarning = vi.fn();
    const { result } = renderHook(() => useTimer(600, undefined, onWarning));

    act(() => {
      vi.advanceTimersByTime(300000); // Advance 300 seconds
    });

    expect(onWarning).toHaveBeenCalledOnce();
  });

  it('should trigger onWarning only once', async () => {
    const onWarning = vi.fn();
    const { result } = renderHook(() => useTimer(600, undefined, onWarning));

    act(() => {
      vi.advanceTimersByTime(300000); // First warning at 300 seconds
      vi.advanceTimersByTime(100000); // Continue past 300
    });

    expect(onWarning).toHaveBeenCalledOnce();
  });

  it('should expire when time reaches zero', async () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useTimer(10, onExpire));

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.remaining).toBe(0);
    expect(result.current.isExpired).toBe(true);
    expect(onExpire).toHaveBeenCalledOnce();
  });

  it('should pause timer', async () => {
    const { result } = renderHook(() => useTimer(300));

    act(() => {
      vi.advanceTimersByTime(5000); // 5 seconds pass
    });

    expect(result.current.remaining).toBe(295);

    act(() => {
      result.current.pause();
    });

    expect(result.current.isPaused).toBe(true);

    act(() => {
      vi.advanceTimersByTime(10000); // Advance time but timer should be paused
    });

    // Should still be at 295 because timer is paused
    expect(result.current.remaining).toBe(295);
  });

  it('should resume timer after pause', async () => {
    const { result } = renderHook(() => useTimer(300));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.remaining).toBe(295);

    act(() => {
      result.current.pause();
    });

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.remaining).toBe(295); // Still paused

    act(() => {
      result.current.resume();
    });

    expect(result.current.isPaused).toBe(false);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.remaining).toBe(290); // Now it's counting down
  });

  it('should not decrement below zero', async () => {
    const { result } = renderHook(() => useTimer(2));

    act(() => {
      vi.advanceTimersByTime(5000); // More time than duration
    });

    expect(result.current.remaining).toBe(0);
    expect(result.current.isExpired).toBe(true);
  });

  it('should calculate timer accuracy within tolerance', async () => {
    // Test that timer is accurate to within ±1 second over 1 hour (3600 seconds)
    const onExpire = vi.fn();
    const { result } = renderHook(() => useTimer(3600, onExpire));

    act(() => {
      vi.advanceTimersByTime(3600000); // Exactly 1 hour in milliseconds
    });

    // Should expire within 1 second tolerance
    expect(result.current.remaining).toBeLessThanOrEqual(0);
    expect(result.current.isExpired).toBe(true);
    expect(onExpire).toHaveBeenCalled();
  });
});

