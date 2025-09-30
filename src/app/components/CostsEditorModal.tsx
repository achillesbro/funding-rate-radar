'use client';

import { useState, useRef, useEffect } from 'react';
import { CostItem } from '../../types';
import { jp } from '../i18n/jpKatakana';

interface CostsEditorModalProps {
  isOpen: boolean;
  costs: CostItem[];
  onClose: () => void;
  onSave: (costs: CostItem[]) => void;
}

const REGION_PRESETS = {
  EU: [
    { id: 'rent_1br', label: 'Month of rent (1BR)', usd: 1200, category: 'housing' as const },
    { id: 'groceries_month', label: 'Groceries (1 month)', usd: 250, category: 'food' as const },
    { id: 'flight_eu_jp_rt', label: 'Flight EU↔JP (RT, economy)', usd: 900, category: 'travel' as const },
    { id: 'macbook_air', label: 'Laptop (mid-tier)', usd: 1000, category: 'tech' as const },
    { id: 'gym_year', label: 'Gym (1 year)', usd: 300, category: 'leisure' as const },
    { id: 'electricity_month', label: 'Electricity (1 month)', usd: 75, category: 'utilities' as const },
  ],
  US: [
    { id: 'rent_1br', label: 'Month of rent (1BR)', usd: 1500, category: 'housing' as const },
    { id: 'groceries_month', label: 'Groceries (1 month)', usd: 300, category: 'food' as const },
    { id: 'flight_us_jp_rt', label: 'Flight US↔JP (RT, economy)', usd: 1100, category: 'travel' as const },
    { id: 'macbook_air', label: 'Laptop (mid-tier)', usd: 1000, category: 'tech' as const },
    { id: 'gym_year', label: 'Gym (1 year)', usd: 400, category: 'leisure' as const },
    { id: 'electricity_month', label: 'Electricity (1 month)', usd: 100, category: 'utilities' as const },
  ],
  JP: [
    { id: 'rent_1br', label: 'Month of rent (1BR)', usd: 800, category: 'housing' as const },
    { id: 'groceries_month', label: 'Groceries (1 month)', usd: 200, category: 'food' as const },
    { id: 'shinkansen_rt', label: 'Shinkansen Tokyo–Osaka (RT)', usd: 220, category: 'travel' as const },
    { id: 'macbook_air', label: 'Laptop (mid-tier)', usd: 1000, category: 'tech' as const },
    { id: 'ski_pass_week', label: 'Ski pass (1 week, Hokkaidō)', usd: 350, category: 'leisure' as const },
    { id: 'electricity_month', label: 'Electricity (1 month)', usd: 60, category: 'utilities' as const },
  ],
};

export default function CostsEditorModal({ isOpen, costs, onClose, onSave }: CostsEditorModalProps) {
  const [editingCosts, setEditingCosts] = useState<CostItem[]>(costs);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'label' | 'usd' | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [importExportMode, setImportExportMode] = useState<'import' | 'export' | null>(null);
  const [jsonData, setJsonData] = useState<string>('');
  const [lastEdited, setLastEdited] = useState<Date | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize editing costs when modal opens
  useEffect(() => {
    if (isOpen) {
      setEditingCosts(costs);
      setLastEdited(new Date());
    }
  }, [isOpen, costs]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  if (!isOpen) return null;

  const handleCostChange = (id: string, field: 'label' | 'usd', value: string | number) => {
    setEditingCosts(prev => 
      prev.map(cost => 
        cost.id === id 
          ? { ...cost, [field]: field === 'usd' ? Number(value) : value }
          : cost
      )
    );
    setLastEdited(new Date());
  };

  const startInlineEdit = (id: string, field: 'label' | 'usd', currentValue: string | number) => {
    setEditingId(id);
    setEditingField(field);
    setEditingValue(String(currentValue));
  };

  const commitInlineEdit = () => {
    if (editingId && editingField) {
      const value = editingField === 'usd' ? Number(editingValue) : editingValue;
      handleCostChange(editingId, editingField, value);
      setEditingId(null);
      setEditingField(null);
      setEditingValue('');
    }
  };

  const cancelInlineEdit = () => {
    setEditingId(null);
    setEditingField(null);
    setEditingValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitInlineEdit();
    } else if (e.key === 'Escape') {
      cancelInlineEdit();
    }
  };

  const handlePresetApply = (region: keyof typeof REGION_PRESETS) => {
    const presetCosts = REGION_PRESETS[region].map(cost => ({
      ...cost,
      editable: true
    }));
    setEditingCosts(presetCosts);
    setLastEdited(new Date());
  };

  const handleResetToDefaults = () => {
    setEditingCosts(costs);
    setLastEdited(new Date());
  };

  const handleExport = () => {
    setJsonData(JSON.stringify(editingCosts, null, 2));
    setImportExportMode('export');
  };

  const handleImport = () => {
    setJsonData('');
    setImportExportMode('import');
  };

  const handleImportApply = () => {
    try {
      const imported = JSON.parse(jsonData);
      if (Array.isArray(imported)) {
        setEditingCosts(imported);
        setLastEdited(new Date());
        setImportExportMode(null);
      }
    } catch (error) {
      alert('Invalid JSON format');
    }
  };

  const handleSave = () => {
    onSave(editingCosts);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="glass p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 id="modal-title" className="text-lg font-semibold text-ink">{jp.editCosts}</h3>
            {lastEdited && (
              <p className="text-xs text-muted">
                Last edited: {lastEdited.toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink focus-ring"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Region Presets */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-ink mb-3">Region Presets</h4>
          <div className="flex flex-wrap gap-2">
            {Object.keys(REGION_PRESETS).map(region => (
              <button
                key={region}
                onClick={() => handlePresetApply(region as keyof typeof REGION_PRESETS)}
                className="chip focus-ring"
              >
                {region}
              </button>
            ))}
            <button
              onClick={handleResetToDefaults}
              className="chip focus-ring"
            >
              Reset to defaults
            </button>
          </div>
        </div>

        {/* Import/Export */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-ink mb-3">Import/Export</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleImport}
              className="btn--quiet focus-ring"
            >
              Import JSON
            </button>
            <button
              onClick={handleExport}
              className="btn--quiet focus-ring"
            >
              Export JSON
            </button>
          </div>
        </div>

        {/* Import/Export JSON Area */}
        {importExportMode && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-ink mb-3">
              {importExportMode === 'import' ? 'Import JSON' : 'Export JSON'}
            </h4>
            <textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              className="w-full h-32 px-3 py-2 border border-border rounded bg-surface text-ink focus:outline-none focus:border-aizome font-mono text-sm"
              placeholder={importExportMode === 'import' ? 'Paste JSON data here...' : 'JSON data will appear here...'}
              readOnly={importExportMode === 'export'}
            />
            <div className="flex gap-2 mt-2">
              {importExportMode === 'import' && (
                <button
                  onClick={handleImportApply}
                  className="btn focus-ring"
                >
                  Apply Import
                </button>
              )}
              <button
                onClick={() => setImportExportMode(null)}
                className="btn--quiet focus-ring"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Editable Table */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-ink mb-3">Cost Items</h4>
          <div className="space-y-2">
            {editingCosts.map(cost => (
              <div key={cost.id} className="flex items-center space-x-4 p-2 rounded border border-border hover:bg-surface-2">
                {/* Label */}
                <div className="flex-1">
                  {editingId === cost.id && editingField === 'label' ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={commitInlineEdit}
                      className="w-full px-2 py-1 border border-aizome rounded bg-surface text-ink focus:outline-none"
                    />
                  ) : (
                    <div
                      onClick={() => startInlineEdit(cost.id, 'label', cost.label)}
                      className="px-2 py-1 cursor-pointer hover:bg-surface rounded tabular-nums"
                    >
                      {cost.label}
                    </div>
                  )}
                </div>
                
                {/* USD Amount */}
                <div className="flex items-center space-x-1">
                  <span className="text-muted">$</span>
                  {editingId === cost.id && editingField === 'usd' ? (
                    <input
                      ref={inputRef}
                      type="number"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={commitInlineEdit}
                      className="w-20 px-2 py-1 border border-aizome rounded bg-surface text-ink focus:outline-none tabular-nums"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <div
                      onClick={() => startInlineEdit(cost.id, 'usd', cost.usd)}
                      className="w-20 px-2 py-1 cursor-pointer hover:bg-surface rounded text-right tabular-nums"
                    >
                      {cost.usd}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="btn--quiet focus-ring"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn focus-ring"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
