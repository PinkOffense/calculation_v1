import { renderHook, act } from '@testing-library/react';
import { useAnimatedValue } from '../useAnimatedValue';

describe('useAnimatedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useAnimatedValue(100));
    expect(result.current).toBe(100);
  });

  it('returns new value after animation completes', async () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedValue(target, 400),
      { initialProps: { target: 0 } }
    );

    expect(result.current).toBe(0);

    // Change target
    rerender({ target: 100 });

    // Advance past animation duration
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe(100);
  });

  it('starts from previous value when target changes', () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedValue(target, 400),
      { initialProps: { target: 50 } }
    );

    expect(result.current).toBe(50);

    rerender({ target: 200 });

    // During animation, value should be between 50 and 200
    // (it won't have changed in the same tick without RAF advancing)
    expect(result.current).toBeGreaterThanOrEqual(50);
  });

  it('does not animate when target stays the same', () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedValue(target, 400),
      { initialProps: { target: 100 } }
    );

    rerender({ target: 100 });
    expect(result.current).toBe(100);
  });
});
