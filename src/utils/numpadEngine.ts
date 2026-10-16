import { formatNumberOnly } from './currency';

export interface NumpadState {
  thousandsBuffer: string;
  hasDot: boolean;
  subThousandBuffer: string;
}

export interface DisplayParts {
  mainText: string;
  dimmedZeros: string;
}

export function createInitialNumpadState(): NumpadState {
  return {
    thousandsBuffer: '',
    hasDot: false,
    subThousandBuffer: '',
  };
}

export function handleDigitInput(state: NumpadState, digit: string): NumpadState {
  if (!/^[0-9]$/.test(digit)) return state;

  if (!state.hasDot) {
    // Prevent leading zero in thousands mode
    if (!state.thousandsBuffer && digit === '0') {
      return state;
    }
    // Limit to 8 digits before dot (up to 99,999,999 thousand IDR = ~99.9 billion)
    if (state.thousandsBuffer.length >= 8) {
      return state;
    }
    return {
      ...state,
      thousandsBuffer: state.thousandsBuffer + digit,
    };
  } else {
    // In sub-thousand mode: max 3 digits (hundreds, tens, units)
    if (state.subThousandBuffer.length >= 3) {
      return state;
    }
    return {
      ...state,
      subThousandBuffer: state.subThousandBuffer + digit,
    };
  }
}

export function handleAddThousands(state: NumpadState): NumpadState {
  if (!state.thousandsBuffer || state.thousandsBuffer === '0') {
    return state;
  }

  if (!state.hasDot) {
    if (state.thousandsBuffer.length + 3 > 8) {
      return state;
    }
    return {
      ...state,
      thousandsBuffer: state.thousandsBuffer + '000',
    };
  } else {
    // If user is at "10.", pressing "000" completes the sub-thousands to round thousands
    if (state.subThousandBuffer === '') {
      return {
        ...state,
        hasDot: false,
        subThousandBuffer: '',
      };
    }
    // If user entered e.g. "5", pad out to 3 digits ("500")
    return {
      ...state,
      subThousandBuffer: state.subThousandBuffer.padEnd(3, '0'),
    };
  }
}

export function handleDotInput(state: NumpadState): NumpadState {
  if (state.hasDot) return state;

  const thousands = state.thousandsBuffer || '0';
  return {
    ...state,
    thousandsBuffer: thousands,
    hasDot: true,
    subThousandBuffer: '',
  };
}

export function handleBackspaceInput(state: NumpadState): NumpadState {
  if (state.hasDot) {
    if (state.subThousandBuffer.length > 0) {
      return {
        ...state,
        subThousandBuffer: state.subThousandBuffer.slice(0, -1),
      };
    }
    // If sub-thousand buffer is empty, backspace removes the dot
    if (state.thousandsBuffer === '0') {
      return createInitialNumpadState();
    }
    return {
      ...state,
      hasDot: false,
    };
  }

  if (state.thousandsBuffer.length > 1) {
    return {
      ...state,
      thousandsBuffer: state.thousandsBuffer.slice(0, -1),
    };
  }

  // 1 digit or empty: reset to initial
  return createInitialNumpadState();
}

export function computeNumericAmount(state: NumpadState): number {
  if (!state.thousandsBuffer) return 0;
  const thousands = parseInt(state.thousandsBuffer, 10);
  if (isNaN(thousands)) return 0;

  if (!state.hasDot) {
    return thousands * 1000;
  }

  const subStr = state.subThousandBuffer.padEnd(3, '0');
  const subNum = parseInt(subStr, 10) || 0;
  return thousands * 1000 + subNum;
}

export function computeDisplayParts(state: NumpadState): DisplayParts {
  if (!state.thousandsBuffer) {
    return {
      mainText: '0',
      dimmedZeros: '',
    };
  }

  const thousandsNum = parseInt(state.thousandsBuffer, 10);
  const formattedThousands = formatNumberOnly(thousandsNum);

  if (!state.hasDot) {
    return {
      mainText: `${formattedThousands}.000`,
      dimmedZeros: '',
    };
  }

  const typedSub = state.subThousandBuffer;
  const mainText = `${formattedThousands}.${typedSub}`;
  const remainingZeros = Math.max(0, 3 - typedSub.length);
  const dimmedZeros = '0'.repeat(remainingZeros);

  return {
    mainText,
    dimmedZeros,
  };
}
