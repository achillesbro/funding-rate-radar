// localStorage helpers for funding controls persistence

export const loadControlsState = (): {
  selectedAssets: string[];
  selectedExchanges: string[];
  sortBy: 'apr' | 'absApr' | 'negativesFirst';
  quickFilters: {
    negativesOnly: boolean;
    nextUnder1h: boolean;
    pinned: boolean;
  };
} => {
  if (typeof window === 'undefined') {
    return {
      selectedAssets: [],
      selectedExchanges: [],
      sortBy: 'absApr',
      quickFilters: {
        negativesOnly: false,
        nextUnder1h: false,
        pinned: false,
      },
    };
  }

  try {
    const stored = localStorage.getItem('fs.controls.v1');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load controls state from localStorage:', error);
  }

  return {
    selectedAssets: [],
    selectedExchanges: [],
    sortBy: 'absApr',
    quickFilters: {
      negativesOnly: false,
      nextUnder1h: false,
      pinned: false,
    },
  };
};

export const saveControlsState = (state: {
  selectedAssets: string[];
  selectedExchanges: string[];
  sortBy: 'apr' | 'absApr' | 'negativesFirst';
  quickFilters: {
    negativesOnly: boolean;
    nextUnder1h: boolean;
    pinned: boolean;
  };
}) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('fs.controls.v1', JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save controls state to localStorage:', error);
  }
};
