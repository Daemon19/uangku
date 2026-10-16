import { describe, it, expect } from 'vitest';
import {
  createInitialNumpadState,
  handleDigitInput,
  handleAddThousands,
  handleDotInput,
  handleBackspaceInput,
  computeNumericAmount,
  computeDisplayParts,
  type NumpadState,
} from './numpadEngine';

describe('numpadEngine', () => {
  it('starts at initial empty state', () => {
    const state = createInitialNumpadState();
    expect(computeNumericAmount(state)).toBe(0);
    expect(computeDisplayParts(state)).toEqual({ mainText: '0', dimmedZeros: '' });
  });

  it('ignores leading 0 on empty buffer', () => {
    let state = createInitialNumpadState();
    state = handleDigitInput(state, '0');
    expect(computeNumericAmount(state)).toBe(0);
    expect(computeDisplayParts(state)).toEqual({ mainText: '0', dimmedZeros: '' });
  });

  it('handles single digit typing (e.g. 1 -> 1.000)', () => {
    let state = createInitialNumpadState();
    state = handleDigitInput(state, '1');
    expect(computeNumericAmount(state)).toBe(1000);
    expect(computeDisplayParts(state)).toEqual({ mainText: '1.000', dimmedZeros: '' });
  });

  it('handles multiple digits (e.g. 10 -> 10.000)', () => {
    let state = createInitialNumpadState();
    state = handleDigitInput(state, '1');
    state = handleDigitInput(state, '0');
    expect(computeNumericAmount(state)).toBe(10000);
    expect(computeDisplayParts(state)).toEqual({ mainText: '10.000', dimmedZeros: '' });
  });

  it('adds thousands via 000 button to easily make millions', () => {
    let state = createInitialNumpadState();
    state = handleDigitInput(state, '1');
    state = handleAddThousands(state);
    expect(computeNumericAmount(state)).toBe(1000000);
    expect(computeDisplayParts(state)).toEqual({ mainText: '1.000.000', dimmedZeros: '' });

    state = createInitialNumpadState();
    state = handleDigitInput(state, '5');
    state = handleDigitInput(state, '0');
    state = handleAddThousands(state);
    expect(computeNumericAmount(state)).toBe(50000000);
    expect(computeDisplayParts(state)).toEqual({ mainText: '50.000.000', dimmedZeros: '' });
  });

  it('handles sub-thousand typing with dimmed zeros (e.g. 10-dot-500 -> 10.500)', () => {
    let state = createInitialNumpadState();
    state = handleDigitInput(state, '1');
    state = handleDigitInput(state, '0');
    state = handleDotInput(state);

    // After dot: 10. + dimmed 000
    expect(computeNumericAmount(state)).toBe(10000);
    expect(computeDisplayParts(state)).toEqual({ mainText: '10.', dimmedZeros: '000' });

    // After 5: 10.5 + dimmed 00
    state = handleDigitInput(state, '5');
    expect(computeNumericAmount(state)).toBe(10500);
    expect(computeDisplayParts(state)).toEqual({ mainText: '10.5', dimmedZeros: '00' });

    // After 0: 10.50 + dimmed 0
    state = handleDigitInput(state, '0');
    expect(computeNumericAmount(state)).toBe(10500);
    expect(computeDisplayParts(state)).toEqual({ mainText: '10.50', dimmedZeros: '0' });

    // After second 0: 10.500 (no dimmed zeros)
    state = handleDigitInput(state, '0');
    expect(computeNumericAmount(state)).toBe(10500);
    expect(computeDisplayParts(state)).toEqual({ mainText: '10.500', dimmedZeros: '' });

    // 4th digit after dot is ignored (max 3 digits)
    state = handleDigitInput(state, '9');
    expect(computeNumericAmount(state)).toBe(10500);
    expect(computeDisplayParts(state)).toEqual({ mainText: '10.500', dimmedZeros: '' });
  });

  it('handles shorthand sub-thousand amounts correctly (e.g. 10.4 -> 10.400)', () => {
    let state = createInitialNumpadState();
    state = handleDigitInput(state, '1');
    state = handleDigitInput(state, '0');
    state = handleDotInput(state);
    state = handleDigitInput(state, '4');

    expect(computeNumericAmount(state)).toBe(10400);
    expect(computeDisplayParts(state)).toEqual({ mainText: '10.4', dimmedZeros: '00' });
  });

  it('reverts typed digits on backspace (e.g. 10.4-backspace makes 10.000 not 10.40)', () => {
    let state = createInitialNumpadState();
    state = handleDigitInput(state, '1');
    state = handleDigitInput(state, '0');
    state = handleDotInput(state);
    state = handleDigitInput(state, '4');
    expect(computeDisplayParts(state)).toEqual({ mainText: '10.4', dimmedZeros: '00' });

    // Backspace once removes '4', leaves '10.' with dimmed '000'
    state = handleBackspaceInput(state);
    expect(computeDisplayParts(state)).toEqual({ mainText: '10.', dimmedZeros: '000' });
    expect(computeNumericAmount(state)).toBe(10000);

    // Backspace again removes '.' and cleanly reverts to '10.000'
    state = handleBackspaceInput(state);
    expect(computeDisplayParts(state)).toEqual({ mainText: '10.000', dimmedZeros: '' });
    expect(computeNumericAmount(state)).toBe(10000);

    // Backspace again removes '0', leaves '1.000'
    state = handleBackspaceInput(state);
    expect(computeDisplayParts(state)).toEqual({ mainText: '1.000', dimmedZeros: '' });
    expect(computeNumericAmount(state)).toBe(1000);

    // Backspace again resets to '0'
    state = handleBackspaceInput(state);
    expect(computeDisplayParts(state)).toEqual({ mainText: '0', dimmedZeros: '' });
    expect(computeNumericAmount(state)).toBe(0);
  });

  it('handles dot pressed on empty buffer', () => {
    let state = createInitialNumpadState();
    state = handleDotInput(state);
    expect(computeDisplayParts(state)).toEqual({ mainText: '0.', dimmedZeros: '000' });
    expect(computeNumericAmount(state)).toBe(0);

    state = handleDigitInput(state, '5');
    expect(computeDisplayParts(state)).toEqual({ mainText: '0.5', dimmedZeros: '00' });
    expect(computeNumericAmount(state)).toBe(500);

    // Backspacing back to empty
    state = handleBackspaceInput(state);
    state = handleBackspaceInput(state);
    expect(computeDisplayParts(state)).toEqual({ mainText: '0', dimmedZeros: '' });
  });
});
