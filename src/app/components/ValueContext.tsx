'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CostItem, ValueComparison } from '../../types';
import { DEFAULT_COSTS, loadCostsFromStorage, saveCostsToStorage } from '../data/costs';
import { WAGE_PRESETS, loadWagePresetsFromStorage, wageEquivalents } from '../data/wages';
import { computeComparisons, formatMultiple, formatUSD, generateOneLineSummary } from '../../lib/math';
import { selectSmartContextItems, SmartFilterOptions } from '../../lib/utils/valueContext';
import { XMultipleBar } from './XMultipleBar';
import { jp } from '../i18n/jpKatakana';
import CostsEditorModal from './CostsEditorModal';

// Tooltip Pill Component
const TooltipPill = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        className="flex items-center gap-1 px-2 py-1 text-xs leading-tight bg-transparent border border-amber/30 text-aizome rounded-full hover:border-amber/50 hover:bg-amber/5 transition-all duration-200 shadow-sm"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ maxWidth: '34ch' }}
      >
        <span>How it works</span>
        <span className="text-kori">(ハウツー)</span>
        <svg className="w-3 h-3 text-kori" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </button>
      
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 p-3 bg-surface border border-border rounded-lg shadow-lg z-50">
          <div className="text-xs leading-tight text-ink">
            <p className="mb-2">
              Type a USD amount to contextualise your PnL (what it buys or could've covered).
            </p>
            <p className="mb-2">
              Explore live funding rates across assets and exchanges with filters; data updates every 30s.
            </p>
            <p className="text-kori">
              ハウツー：USD額を入力するとPnLが現実の支出に置き換わります。続いて銘柄／取引所別のライブ・ファンディング率をフィルターで確認（30秒ごとに更新）。
            </p>
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
        </div>
      )}
    </div>
  );
};

interface ValueContextProps {
  className?: string;
}

type SortMode = 'amount' | 'priority' | 'edited';
type FilterType = 'oneOff' | 'monthly' | 'annual';

export default function ValueContext({ className = '' }: ValueContextProps) {
  const [amount, setAmount] = useState<number>(0);
  const [displayValue, setDisplayValue] = useState<string>('');
  
  // Initialize display value when amount changes
  useEffect(() => {
    setDisplayValue(amount === 0 ? '' : amount.toLocaleString('en-US'));
  }, [amount]);
  const [costs, setCosts] = useState<CostItem[]>(DEFAULT_COSTS);
  const [wagePresets, setWagePresets] = useState(WAGE_PRESETS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('amount');
  const [filters, setFilters] = useState<FilterType[]>([]);
  const [isSticky, setIsSticky] = useState(false);
  const [debouncedAmount, setDebouncedAmount] = useState<number>(0);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load costs and state from localStorage on mount
  useEffect(() => {
    setCosts(loadCostsFromStorage());
    setWagePresets(loadWagePresetsFromStorage());
    
    // Load persisted state
    try {
      const savedState = localStorage.getItem('fs.value.v2');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.amount) setAmount(parsed.amount);
        if (parsed.selectedCategory) setSelectedCategory(parsed.selectedCategory);
        if (parsed.sortMode) setSortMode(parsed.sortMode);
        if (parsed.filters) setFilters(parsed.filters);
      }
    } catch (error) {
      console.warn('Failed to load value context state:', error);
    }
  }, []);

  // Debounce amount changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setDebouncedAmount(amount);
    }, 120);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [amount]);

  // Persist state changes
  useEffect(() => {
    const state = {
      amount,
      selectedCategory,
      sortMode,
      filters
    };
    localStorage.setItem('fs.value.v2', JSON.stringify(state));
  }, [amount, selectedCategory, sortMode, filters]);

  // Filter costs by category
  const filteredCosts = useMemo(() => 
    costs.filter(cost => 
    selectedCategory === 'all' || cost.category === selectedCategory
    ), [costs, selectedCategory]
  );

  // Smart selection of context items
  const smartItems = useMemo(() => {
    if (debouncedAmount === 0) return [];
    
    // Create predicate for existing filters
    const predicate: SmartFilterOptions['predicate'] = (item) => {
      // Apply existing filter logic
      if (filters.length > 0) {
        if (filters.includes('oneOff') && ['tech', 'travel'].includes(item.category || '')) return true;
        if (filters.includes('monthly') && ['housing', 'food', 'utilities'].includes(item.category || '')) return true;
        if (filters.includes('annual') && ['leisure', 'housing'].includes(item.category || '')) return true;
        return false;
      }
      return true;
    };
    
    return selectSmartContextItems(filteredCosts, debouncedAmount, { predicate });
  }, [debouncedAmount, filteredCosts, filters]);

  // Convert smart items to comparisons format
  const comparisons = useMemo(() => 
    smartItems.map(item => ({
      item,
      multiple: debouncedAmount / item.usd,
      isNiceInteger: Math.abs(debouncedAmount / item.usd - Math.round(debouncedAmount / item.usd)) < 0.15
    })),
    [smartItems, debouncedAmount]
  );

  // Calculate wage equivalents
  const wageEquivalentsDisplay = useMemo(() => {
    if (debouncedAmount === 0) return null;
    
    const regions: Array<'US'|'EU'|'JP'> = ['US','EU','JP'];
    const wagesToShow = regions.map(r => ({ r, wage: wagePresets[r] }));
    
    const equivs = wagesToShow.map(({ r, wage }) => ({
      region: r,
      ...wageEquivalents(debouncedAmount, wage)
    }));
    
    const fmt = (v: number) => (Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(1));
    
    // Choose the best unit to display based on amount size
    const getBestUnit = (equiv: typeof equivs[0]) => {
      const absYears = Math.abs(equiv.years);
      const absMonths = Math.abs(equiv.months);
      
      if (absYears >= 0.5) return `≈ ${fmt(equiv.years)} years`;
      if (absMonths >= 0.5) return `≈ ${fmt(equiv.months)} months`;
      return `≈ ${fmt(equiv.days)} days`;
    };
    
    const line = equivs
      .map(e => `${getBestUnit(e)} (${e.region})`)
      .join(' • ');
    
    return { equivs, line };
  }, [debouncedAmount, wagePresets]);

  // Compute domain for X-Multiple Ruler (shared across all 5 items)
  const multiples = useMemo(() => {
    const safeX = debouncedAmount > 0 ? debouncedAmount : 1;
    return smartItems.map(it => it.usd / safeX).filter(Number.isFinite);
  }, [smartItems, debouncedAmount]);

  const domainMin = useMemo(() => Math.min(0.01, ...multiples, 0.01), [multiples]);
  const domainMax = useMemo(() => Math.max(10, ...multiples, 10), [multiples]);


  // Get unique categories
  const categories = useMemo(() => 
    ['all', ...Array.from(new Set(costs.map(c => c.category).filter(Boolean)))],
    [costs]
  );

  // Normalize bars to largest multiple
  const maxMultiple = useMemo(() => 
    Math.max(...comparisons.map(c => Math.abs(c.multiple))),
    [comparisons]
  );

  // Helper functions for number formatting
  const formatNumber = useCallback((num: number): string => {
    if (num === 0) return '';
    return num.toLocaleString('en-US');
  }, []);

  const parseNumber = useCallback((str: string): number => {
    // Remove commas and parse as number
    const cleaned = str.replace(/,/g, '');
    return parseFloat(cleaned) || 0;
  }, []);

  const handleAmountChange = useCallback((value: number) => {
    setAmount(value);
    setDisplayValue(formatNumber(value));
  }, [formatNumber]);

  const handleQuickAmount = useCallback((delta: number) => {
    const newAmount = amount + delta;
    setAmount(newAmount);
    setDisplayValue(formatNumber(newAmount));
  }, [amount, formatNumber]);

  const toggleFilter = useCallback((filter: FilterType) => {
    setFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  }, []);


  const showPreviewDialog = useCallback((canvas: HTMLCanvasElement) => {
    // Create preview dialog
    const previewDialog = document.createElement('div');
    previewDialog.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    previewDialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      backdrop-filter: blur(4px);
    `;

    const previewContent = document.createElement('div');
    previewContent.style.cssText = `
      background: rgba(7, 12, 22, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 24px;
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      display: flex;
      flex-direction: column;
      align-items: center;
    `;

    const previewImg = document.createElement('img');
    previewImg.src = canvas.toDataURL('image/png');
    previewImg.style.cssText = `
      max-width: 80%;
      max-height: 70vh;
      height: auto;
      border-radius: 8px;
    `;


    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
      margin-top: 16px;
      justify-content: center;
    `;

    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '📥 Download PNG';
    downloadBtn.style.cssText = `
      background: #2D4B7C;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-weight: 500;
      cursor: pointer;
      font-size: 14px;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: 12px;
      right: 12px;
      background: transparent;
      color: #B8C4D7;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
    `;

    const closeDialog = () => {
      document.body.removeChild(previewDialog);
    };

    downloadBtn.onclick = () => {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `pnl-context-${Math.abs(debouncedAmount)}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      closeDialog();
    };

    closeBtn.onclick = closeDialog;
    previewDialog.onclick = (e) => {
      if (e.target === previewDialog) closeDialog();
    };


    buttonContainer.appendChild(downloadBtn);
    previewContent.appendChild(closeBtn);
    previewContent.appendChild(previewImg);
    previewContent.appendChild(buttonContainer);
    previewDialog.appendChild(previewContent);
    document.body.appendChild(previewDialog);
  }, [debouncedAmount]);

  const downloadPnLCard = useCallback(async () => {
    if (!comparisons.length || debouncedAmount === 0) return;

    try {
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size (card dimensions)
      canvas.width = 800;
      canvas.height = 600;

      // Load background image
      const backgroundImg = new Image();
      backgroundImg.crossOrigin = 'anonymous';
      
      backgroundImg.onload = () => {
        // Draw background with same styling as the app
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
        
        // Add dark overlay (matching the app's gradient)
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(11, 18, 32, 0.15)');
        gradient.addColorStop(0.4, 'rgba(11, 18, 32, 0.25)');
        gradient.addColorStop(0.7, 'rgba(11, 18, 32, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add glass card background
        ctx.fillStyle = 'rgba(7, 12, 22, 0.42)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        const cardPadding = 40;
        const cardWidth = canvas.width - (cardPadding * 2);
        const cardHeight = canvas.height - (cardPadding * 2);
        
        // Rounded rectangle for glass card
        ctx.beginPath();
        ctx.roundRect(cardPadding, cardPadding, cardWidth, cardHeight, 12);
        ctx.fill();
        ctx.stroke();

        // Add blur effect (simulated with semi-transparent overlay)
        ctx.fillStyle = 'rgba(7, 12, 22, 0.2)';
        ctx.fill();

        // Set text styles
        ctx.fillStyle = '#E6EDF5'; // --ink
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Title with katakana sublabel
        ctx.fillStyle = '#E6EDF5'; // --ink
        ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
        ctx.fillText('PnL Value Context', cardPadding + 30, cardPadding + 30);
        
        // Katakana sublabel for title
        ctx.fillStyle = '#7C93B2'; // --kori
        ctx.font = '14px system-ui, -apple-system, sans-serif';
        ctx.fillText('バリュー・コンテキスト', cardPadding + 30, cardPadding + 58);

        // Amount
        ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
        const amountColor = debouncedAmount >= 0 ? '#D0A24A' : '#B44A4A'; // amber or akane
        ctx.fillStyle = amountColor;
        const amountText = `${debouncedAmount >= 0 ? '+' : '-'}$${Math.abs(debouncedAmount).toLocaleString()}`;
        ctx.fillText(amountText, cardPadding + 30, cardPadding + 90);

        // Subtitle with katakana sublabel
        ctx.fillStyle = '#B8C4D7'; // --ink-muted
        ctx.font = '20px system-ui, -apple-system, sans-serif';
        const subtitle = debouncedAmount >= 0 ? 'This covers:' : 'This could have covered:';
        ctx.fillText(subtitle, cardPadding + 30, cardPadding + 150);
        
        // Katakana sublabel for subtitle
        ctx.fillStyle = '#7C93B2'; // --kori
        ctx.font = '12px system-ui, -apple-system, sans-serif';
        const subtitleJp = debouncedAmount >= 0 ? 'カバー相当' : '不足相当';
        ctx.fillText(subtitleJp, cardPadding + 30, cardPadding + 172);

        // Wage equivalent
        if (wageEquivalentsDisplay) {
          ctx.fillStyle = '#B8C4D7'; // --ink-muted
          ctx.font = '14px system-ui, -apple-system, sans-serif';
          ctx.fillText('Wage Equivalent:', cardPadding + 30, cardPadding + 200);
          
          ctx.fillStyle = '#E6EDF5'; // --ink
          ctx.font = '12px system-ui, -apple-system, sans-serif';
          
          // Split the wage line if it's too long for the canvas
          const maxWidth = canvas.width - cardPadding * 2 - 60;
          const words = wageEquivalentsDisplay.line.split(' • ');
          let currentLine = '';
          let lineY = cardPadding + 220;
          
          words.forEach((word, index) => {
            const testLine = currentLine + (currentLine ? ' • ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
              ctx.fillText(currentLine, cardPadding + 30, lineY);
              currentLine = word;
              lineY += 16;
            } else {
              currentLine = testLine;
            }
            
            // Draw the last line
            if (index === words.length - 1) {
              ctx.fillText(currentLine, cardPadding + 30, lineY);
            }
          });
        }

        // Items list
        ctx.fillStyle = '#E6EDF5';
        ctx.font = '18px system-ui, -apple-system, sans-serif';
        let yOffset = cardPadding + (wageEquivalentsDisplay ? 260 : 200);
        
        comparisons.slice(0, 5).forEach((comparison, index) => {
          if (yOffset > canvas.height - 60) return; // Prevent overflow
          
          const multiple = Math.abs(comparison.multiple);
          const multipleText = `${multiple >= 1000 ? Math.round(multiple).toLocaleString() : multiple.toFixed(multiple >= 10 ? 1 : 2)}×`;
          
          // Item name
          ctx.fillStyle = '#E6EDF5';
          ctx.fillText(comparison.item.label, cardPadding + 30, yOffset);
          
          // Multiple
          ctx.fillStyle = amountColor;
          ctx.textAlign = 'right';
          ctx.fillText(multipleText, canvas.width - cardPadding - 30, yOffset);
          ctx.textAlign = 'left';
          
          yOffset += 35;
        });

        // Load and draw FujiScan logo
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        
        logoImg.onload = () => {
          // Logo dimensions for the red rectangle area
          const logoWidth = 200; // Much larger to fill the red rectangle area
          const logoHeight = Math.round(logoWidth * 9 / 16); // 16:9 aspect ratio = 112px
          const logoX = canvas.width - logoWidth - cardPadding - 20; // Positioned in the red rectangle area
          const logoY = cardPadding + 30; // Align with title area
          
          // Save state for rounded corners
          ctx.save();
          
          // Create rounded rectangle clipping path for logo (matching main page)
          const logoRadius = 8;
          ctx.beginPath();
          ctx.roundRect(logoX, logoY, logoWidth, logoHeight, logoRadius);
          ctx.clip();
          
          // Draw logo
          ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
          
          // Restore state
          ctx.restore();
          
          // Footer text
          ctx.fillStyle = '#7C93B2'; // --kori
          ctx.font = '14px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Generated by FujiScan', canvas.width / 2, canvas.height - 30);

        // Show preview dialog
        showPreviewDialog(canvas);
        };
        
        logoImg.onerror = () => {
          console.warn('Failed to load FujiScan logo, proceeding without it');
          // Footer text without logo
          ctx.fillStyle = '#7C93B2'; // --kori
          ctx.font = '14px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Generated by FujiScan', canvas.width / 2, canvas.height - 30);

        // Show preview dialog
        showPreviewDialog(canvas);
        };
        
        logoImg.src = '/FujiScan-logo-wide.png';
      };

      backgroundImg.onerror = () => {
        // Fallback: create image without background
        // Add glass card background only
        ctx.fillStyle = 'rgba(7, 12, 22, 0.42)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        const cardPadding = 40;
        const cardWidth = canvas.width - (cardPadding * 2);
        const cardHeight = canvas.height - (cardPadding * 2);
        
        ctx.beginPath();
        ctx.roundRect(cardPadding, cardPadding, cardWidth, cardHeight, 12);
        ctx.fill();
        ctx.stroke();

        // Add blur effect (simulated with semi-transparent overlay)
        ctx.fillStyle = 'rgba(7, 12, 22, 0.2)';
        ctx.fill();

        // Set text styles
        ctx.fillStyle = '#E6EDF5'; // --ink
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Title with katakana sublabel
        ctx.fillStyle = '#E6EDF5'; // --ink
        ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
        ctx.fillText('PnL Value Context', cardPadding + 30, cardPadding + 30);
        
        // Katakana sublabel for title
        ctx.fillStyle = '#7C93B2'; // --kori
        ctx.font = '14px system-ui, -apple-system, sans-serif';
        ctx.fillText('バリュー・コンテキスト', cardPadding + 30, cardPadding + 58);

        // Amount
        ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
        const amountColor = debouncedAmount >= 0 ? '#D0A24A' : '#B44A4A'; // amber or akane
        ctx.fillStyle = amountColor;
        const amountText = `${debouncedAmount >= 0 ? '+' : '-'}$${Math.abs(debouncedAmount).toLocaleString()}`;
        ctx.fillText(amountText, cardPadding + 30, cardPadding + 90);

        // Subtitle with katakana sublabel
        ctx.fillStyle = '#B8C4D7'; // --ink-muted
        ctx.font = '20px system-ui, -apple-system, sans-serif';
        const subtitle = debouncedAmount >= 0 ? 'This covers:' : 'This could have covered:';
        ctx.fillText(subtitle, cardPadding + 30, cardPadding + 150);
        
        // Katakana sublabel for subtitle
        ctx.fillStyle = '#7C93B2'; // --kori
        ctx.font = '12px system-ui, -apple-system, sans-serif';
        const subtitleJp = debouncedAmount >= 0 ? 'カバー相当' : '不足相当';
        ctx.fillText(subtitleJp, cardPadding + 30, cardPadding + 172);

        // Wage equivalent
        if (wageEquivalentsDisplay) {
          ctx.fillStyle = '#B8C4D7'; // --ink-muted
          ctx.font = '14px system-ui, -apple-system, sans-serif';
          ctx.fillText('Wage Equivalent:', cardPadding + 30, cardPadding + 200);
          
          ctx.fillStyle = '#E6EDF5'; // --ink
          ctx.font = '12px system-ui, -apple-system, sans-serif';
          
          // Split the wage line if it's too long for the canvas
          const maxWidth = canvas.width - cardPadding * 2 - 60;
          const words = wageEquivalentsDisplay.line.split(' • ');
          let currentLine = '';
          let lineY = cardPadding + 220;
          
          words.forEach((word, index) => {
            const testLine = currentLine + (currentLine ? ' • ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
              ctx.fillText(currentLine, cardPadding + 30, lineY);
              currentLine = word;
              lineY += 16;
            } else {
              currentLine = testLine;
            }
            
            // Draw the last line
            if (index === words.length - 1) {
              ctx.fillText(currentLine, cardPadding + 30, lineY);
            }
          });
        }

        // Items list
        ctx.fillStyle = '#E6EDF5';
        ctx.font = '18px system-ui, -apple-system, sans-serif';
        let yOffset = cardPadding + (wageEquivalentsDisplay ? 260 : 200);
        
        comparisons.slice(0, 5).forEach((comparison, index) => {
          if (yOffset > canvas.height - 60) return; // Prevent overflow
          
          const multiple = Math.abs(comparison.multiple);
          const multipleText = `${multiple >= 1000 ? Math.round(multiple).toLocaleString() : multiple.toFixed(multiple >= 10 ? 1 : 2)}×`;
          
          // Item name
          ctx.fillStyle = '#E6EDF5';
          ctx.fillText(comparison.item.label, cardPadding + 30, yOffset);
          
          // Multiple
          ctx.fillStyle = amountColor;
          ctx.textAlign = 'right';
          ctx.fillText(multipleText, canvas.width - cardPadding - 30, yOffset);
          ctx.textAlign = 'left';
          
          yOffset += 35;
        });

        // Load and draw FujiScan logo (fallback version)
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        
        logoImg.onload = () => {
          // Logo dimensions for the red rectangle area
          const logoWidth = 200; // Much larger to fill the red rectangle area
          const logoHeight = Math.round(logoWidth * 9 / 16); // 16:9 aspect ratio = 112px
          const logoX = canvas.width - logoWidth - cardPadding - 20; // Positioned in the red rectangle area
          const logoY = cardPadding + 30; // Align with title area
          
          // Save state for rounded corners
          ctx.save();
          
          // Create rounded rectangle clipping path for logo (matching main page)
          const logoRadius = 8;
          ctx.beginPath();
          ctx.roundRect(logoX, logoY, logoWidth, logoHeight, logoRadius);
          ctx.clip();
          
          // Draw logo
          ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
          
          // Restore state
          ctx.restore();
          
          // Footer text
          ctx.fillStyle = '#7C93B2'; // --kori
          ctx.font = '14px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Generated by FujiScan', canvas.width / 2, canvas.height - 30);

        // Show preview dialog
        showPreviewDialog(canvas);
        };
        
        logoImg.onerror = () => {
          console.warn('Failed to load FujiScan logo, proceeding without it');
          // Footer text without logo
          ctx.fillStyle = '#7C93B2'; // --kori
          ctx.font = '14px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Generated by FujiScan', canvas.width / 2, canvas.height - 30);

        // Show preview dialog
        showPreviewDialog(canvas);
        };
        
        logoImg.src = '/FujiScan-logo-wide.png';
      };

      // Load the background image
      backgroundImg.src = '/FujiScan-bg-2.png';

    } catch (error) {
      console.error('Failed to generate PnL card:', error);
    }
  }, [comparisons, debouncedAmount, wageEquivalentsDisplay]);

  const handleSaveCosts = useCallback((newCosts: CostItem[]) => {
    setCosts(newCosts);
    saveCostsToStorage(newCosts);
    // Reload wage presets in case they were updated in the modal
    setWagePresets(loadWagePresetsFromStorage());
  }, []);

  const isGain = debouncedAmount >= 0;
  const isNeutral = debouncedAmount === 0;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleQuickAmount(e.shiftKey ? 100 : 10);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleQuickAmount(e.shiftKey ? -100 : -10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleQuickAmount]);

  // Sticky calculator visibility
  useEffect(() => {
    const handleScroll = () => {
      const element = document.querySelector('[data-value-context]');
      if (element) {
        const rect = element.getBoundingClientRect();
        setIsSticky(rect.bottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className={`space-y-6 ${className}`} data-value-context>
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-semibold text-ink tabular-nums">
                PnL Value Context <span className="text-xs text-kori">({jp.valueContextSub})</span>
              </h2>
              <div className="text-sm text-muted">
                {jp.estimates} <span className="text-xs text-kori">({jp.estimatesSub})</span>
              </div>
            </div>
            <TooltipPill />
          </div>
          
          {/* Download button */}
          <div className="flex justify-center">
            <button
              onClick={downloadPnLCard}
              className="btn--quiet text-xs px-4 py-2 focus-ring"
              aria-label="Download PnL card image"
            >
              Download PnL Card
            </button>
          </div>
      </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Controls */}
          <div className="space-y-4">
      {/* Amount Input */}
      <div>
              <label className="block text-sm font-medium text-ink mb-2 tabular-nums">
                {jp.usdAmount} <span className="text-xs text-kori">({jp.usdAmountSub})</span>
        </label>
        <div className="space-y-3">
          {/* Input field - full width on all screen sizes */}
          <input
            type="text"
            value={displayValue}
            onChange={(e) => {
              const parsed = parseNumber(e.target.value);
              setAmount(parsed);
              setDisplayValue(e.target.value);
            }}
            onBlur={() => setDisplayValue(formatNumber(amount))}
            className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-ink focus:outline-none focus:border-aizome tabular-nums focus-ring"
            placeholder="Enter amount..."
          />
          
          {/* Increment buttons - below input on all screen sizes */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[-20000, -5000, -1000, 1000, 5000, 20000].map(delta => (
              <button
                key={delta}
                onClick={() => handleQuickAmount(delta)}
                className="chip chip--mobile text-sm px-3 py-2 focus-ring text-center"
              >
                {delta >= 0 ? '+' : '-'}{Math.abs(delta) >= 1000 ? `${Math.abs(delta) / 1000}k` : Math.abs(delta)}
              </button>
            ))}
          </div>
        </div>
            </div>

            {/* Sort Modes */}

            {/* Filters */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                {jp.filter} <span className="text-xs text-kori">(フィルター)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'oneOff' as FilterType, label: jp.oneOff, sublabel: jp.oneOffSub },
                  { key: 'monthly' as FilterType, label: jp.monthly, sublabel: jp.monthlySub },
                  { key: 'annual' as FilterType, label: jp.annual, sublabel: jp.annualSub }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => toggleFilter(filter.key)}
                    className={`filter-chip ${
                      filters.includes(filter.key) ? 'filter-chip--active' : ''
                    } focus-ring`}
                    role="button"
                    aria-pressed={filters.includes(filter.key)}
                  >
                    {filter.label} <span className="text-xs">({filter.sublabel})</span>
                  </button>
                ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-ink mb-2">
                {jp.category} <span className="text-xs text-kori">({jp.categorySub})</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category || 'all')}
                    className={`chip ${
                      selectedCategory === (category || 'all') ? 'chip--on' : ''
                    } focus-ring`}
                    role="button"
                    aria-pressed={selectedCategory === (category || 'all')}
            >
              {category === 'all' ? 'All' : (category || 'all').charAt(0).toUpperCase() + (category || 'all').slice(1)}
            </button>
          ))}
        </div>
      </div>

            {/* Edit Costs Button */}
            <div>
              <button
                onClick={() => setIsEditorOpen(true)}
                className="btn--quiet w-full focus-ring"
              >
                {jp.editCosts} <span className="text-xs">({jp.editCostsSub})</span>
              </button>
            </div>
          </div>

          {/* Right column: Results */}
        <div className="space-y-3">
            {debouncedAmount !== 0 ? (
                <>
                  {/* Wage Equivalents */}
                  {wageEquivalentsDisplay && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-medium text-ink">
                          Wage Equivalent <span className="text-xs text-kori">(給与相当)</span>
                        </h3>
                        <div className="relative group">
                          <button className="text-xs text-kori hover:text-ink focus-ring">
                            📊
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 p-3 bg-surface border border-border rounded-lg shadow-lg z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="text-xs leading-tight text-ink">
                              <div className="font-medium mb-2">Data Sources:</div>
                              {(['US', 'EU', 'JP'] as const).map(region => (
                                <div key={region} className="mb-1">
                                  <span className="font-medium">{region}:</span> {wagePresets[region].meta.source}
                                </div>
                              ))}
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted bg-surface-2 p-3 rounded-lg border border-border">
                        {wageEquivalentsDisplay.line}
                      </div>
                    </div>
                  )}
                  
                  <h3 className="text-sm font-medium text-ink tabular-nums">
                    {isGain ? jp.covers : jp.costsYou} <span className="text-xs text-kori">({isGain ? jp.coversSub : jp.costsYouSub})</span>
          </h3>
          {comparisons.length > 0 ? (
                  <div className="space-y-3">
                    {/* Smart selected items */}
                    {comparisons.map((comparison) => (
                      <ResultRow
                  key={comparison.item.id}
                        comparison={comparison}
                        isGain={isGain}
                        isNeutral={isNeutral}
                        maxMultiple={maxMultiple}
                        xUSD={debouncedAmount}
                        domainMin={domainMin}
                        domainMax={domainMax}
                      />
                    ))}
                  </div>
                  ) : (
                    <div className="empty-state empty-state--small">
                      <p>{jp.enterAmount} <span className="text-xs text-kori">({jp.enterAmountSub})</span></p>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <p>{jp.enterAmount} <span className="text-xs text-kori">({jp.enterAmountSub})</span></p>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Sticky mini-calculator */}
      {isSticky && (
        <div className="sticky-calculator">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={displayValue}
              onChange={(e) => {
                const parsed = parseNumber(e.target.value);
                setAmount(parsed);
                setDisplayValue(e.target.value);
              }}
              onBlur={() => setDisplayValue(formatNumber(amount))}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface text-ink focus:outline-none focus:border-aizome tabular-nums text-sm focus-ring"
              placeholder="Amount..."
            />
          </div>
        </div>
      )}

      {/* Costs Editor Modal */}
      <CostsEditorModal
        isOpen={isEditorOpen}
        costs={costs}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveCosts}
      />
    </>
  );
}

interface ResultRowProps {
  comparison: ValueComparison;
  isGain: boolean;
  isNeutral: boolean;
  maxMultiple: number;
  xUSD: number;
  domainMin: number;
  domainMax: number;
}

function ResultRow({ 
  comparison, 
  isGain, 
  isNeutral, 
  maxMultiple,
  xUSD,
  domainMin,
  domainMax
}: ResultRowProps) {
  return (
    <div
      className={`result ${
        isNeutral ? 'result--neutral' : isGain ? '' : 'result--loss'
      }`}
    >
      <div>
                    <div className="flex items-center space-x-2">
          <span className="font-medium text-ink tabular-nums">
                        {comparison.item.label}
                      </span>
                      {comparison.isNiceInteger && (
                        <span className="badge text-xs">~</span>
                      )}
                    </div>
        <div className="tooltip">
          <div className="text-xs text-muted tabular-nums cursor-help">
            {jp.unitPrice}: {formatUSD(comparison.item.usd)} / {jp.perUnit}
          </div>
          <div className="tooltip-content">
            {jp.unitPrice} ({jp.unitPriceSub}): {formatUSD(comparison.item.usd)} / {jp.perUnit} ({jp.perUnitSub})
          </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
          className={`multiple tabular-nums ${
            isNeutral ? 'text-kori' : isGain ? 'text-amber' : 'text-akane'
                      }`}
                    >
                      {formatMultiple(comparison.multiple)}
                    </div>
      </div>
      <div className="col-span-2">
        {/* XMultipleBar temporarily hidden - code preserved for future use */}
        {/* <XMultipleBar
          xUSD={xUSD}
          itemUSD={comparison.item.usd}
          domainMin={domainMin}
          domainMax={domainMax}
          className="w-full h-1 relative"
          ariaLabel={`Position ${(comparison.item.usd / xUSD).toFixed(3)}× of input amount`}
        /> */}
        </div>
    </div>
  );
}