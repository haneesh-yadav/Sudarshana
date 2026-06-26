import { describe, it, expect, vi, beforeEach } from 'vitest';
import { showToast } from '../utils/toast';

describe('showToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches a tg-toast custom event with default type', () => {
    const spy = vi.spyOn(window, 'dispatchEvent');
    showToast('Hello world');
    expect(spy).toHaveBeenCalledOnce();
    const event = spy.mock.calls[0][0];
    expect(event.type).toBe('tg-toast');
    expect(event.detail).toEqual({ message: 'Hello world', type: 'info' });
    spy.mockRestore();
  });

  it('dispatches a tg-toast event with specified type', () => {
    const spy = vi.spyOn(window, 'dispatchEvent');
    showToast('Error occurred', 'error');
    const event = spy.mock.calls[0][0];
    expect(event.detail).toEqual({ message: 'Error occurred', type: 'error' });
    spy.mockRestore();
  });

  it('dispatches a tg-toast event with success type', () => {
    const spy = vi.spyOn(window, 'dispatchEvent');
    showToast('Done!', 'success');
    const event = spy.mock.calls[0][0];
    expect(event.detail).toEqual({ message: 'Done!', type: 'success' });
    spy.mockRestore();
  });
});
