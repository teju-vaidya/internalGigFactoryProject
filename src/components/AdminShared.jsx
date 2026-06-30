import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Plus, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';


export const STATUS_CFG = {
  approved:  { bg: 'rgba(112,214,77,0.12)',  color: '#70d64d',  label: 'Approved'  },
  pending:   { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b',  label: 'Pending'   },
  inactive:  { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b',  label: 'Inactive'  },
  rejected:  { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444',  label: 'Not Selected'  },
  suspended: { bg: 'rgba(107,114,128,0.12)', color: '#6b7280',  label: 'Suspended' },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span 
      style={{ background: cfg.bg, color: cfg.color }} 
      className="text-[0.68rem] font-bold px-[8px] py-[3px] rounded-[4px]"
    >
      {cfg.label.toUpperCase()}
    </span>
  );
}

export function CompletionBar({ value = 0, label = "Profile" }) {
  const color = value >= 70 ? '#70d64d' : value >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div>
      <div className="flex justify-between mb-[4px]">
        <span className="text-gray-500 text-[0.65rem] font-semibold uppercase">{label}</span>
        <span style={{ color }} className="text-[0.65rem] font-bold">{value}%</span>
      </div>
      <div className="h-[4px] bg-[#1c1c20] rounded-[99px] overflow-hidden">
        <div 
          style={{ width: `${value}%`, background: color }} 
          className="h-full rounded-[99px] transition-[width] duration-400" 
        />
      </div>
    </div>
  );
}

export function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end   = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  const baseClass = "inline-flex items-center justify-center min-w-[32px] h-[32px] rounded-[6px] border border-[#23232a] bg-[#0c0c0e] text-[#8a8a8a] text-[0.8rem] cursor-pointer px-[8px]";
  const activeClass = "inline-flex items-center justify-center min-w-[32px] h-[32px] rounded-[6px] border border-[#70d64d] bg-[#70d64d] text-black text-[0.8rem] cursor-pointer px-[8px] font-bold";
  const disabledClass = "inline-flex items-center justify-center min-w-[32px] h-[32px] rounded-[6px] border border-[#23232a] bg-[#0c0c0e] text-[#8a8a8a] text-[0.8rem] cursor-not-allowed px-[8px] opacity-30";

  return (
    <div className="flex gap-[6px] flex-wrap items-center">
      <button onClick={() => onPage(page - 1)} disabled={page === 1} className={page === 1 ? disabledClass : baseClass}><ChevronLeft size={14} /></button>
      {start > 1 && <><button onClick={() => onPage(1)} className={baseClass}>1</button><span className="text-[#4b4b57]">…</span></>}
      {pages.map(p => <button key={p} onClick={() => onPage(p)} className={p === page ? activeClass : baseClass}>{p}</button>)}
      {end < totalPages && <><span className="text-[#4b4b57]">…</span><button onClick={() => onPage(totalPages)} className={baseClass}>{totalPages}</button></>}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages} className={page === totalPages ? disabledClass : baseClass}><ChevronRight size={14} /></button>
    </div>
  );
}

export function PageSizeSelector({ limit, onChangeLimit, total, isLoading = false }) {
  return (
    <div className="flex items-center gap-[8px] text-[0.8rem] text-gray-500">
      <span>Show:</span>
      <select
        value={limit}
        onChange={e => onChangeLimit(Number(e.target.value))}
        className="bg-[#0c0c0e] border border-[#23232a] text-white rounded-[6px] px-[8px] py-[4px] text-[0.8rem] outline-none cursor-pointer"
      >
        <option value={10}>10 per page</option>
        <option value={20} disabled={!isLoading && total <= 10}>20 per page</option>
        <option value={50} disabled={!isLoading && total <= 20}>50 per page</option>
        <option value={100} disabled={!isLoading && total <= 50}>100 per page</option>
      </select>
    </div>
  );
}

export function ActivityHistoryView({ id }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user-history', id],
    queryFn: async () => {
      const response = await api.get(`/admin/users/${id}/profile-history`);
      return response;
    },
    enabled: !!id
  });

  if (isLoading) return <div className="text-[#8a8a8a] text-[0.85rem] p-[40px] text-center">Loading history logs...</div>;
  if (error) return <div className="text-[#ef4444] text-[0.85rem] p-[40px] text-center">Error loading logs: {error.message || 'Unknown error'}</div>;

  const { activityLogs = [], loginHistory = [], blockedHistory = [] } = data || {};

  return (
    <div className="flex flex-col gap-[20px]">
      {/* Suspension History */}
      {blockedHistory.length > 0 && (
        <div className="bg-[#1c0c0e] border border-[#ef444433] rounded-[8px] p-[18px]">
          <h4 className="text-[0.75rem] font-extrabold uppercase tracking-[0.6px] text-[#ef4444] m-0 mb-[12px] pb-[6px] border-b border-[#ef444422]">
            Suspension History Logs
          </h4>
          <div className="flex flex-col gap-[10px]">
            {blockedHistory.map(log => (
              <div key={log.id} className="flex justify-between text-[0.8rem] text-[#d1d5db] border-b border-[#ef444411] pb-[6px]">
                <div>
                  <strong>Reason:</strong> {log.reason}
                </div>
                <span className="text-[#8a8a8a] text-[0.72rem]">
                  {new Date(log.created_at).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Action / Activity Logs */}
      <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[8px] p-[18px]">
        <h4 className="text-[0.75rem] font-extrabold uppercase tracking-[0.6px] text-[#70d64d] m-0 mb-[12px] pb-[6px] border-b border-[#23232a]">
          Platform Activity Logs
        </h4>
        {activityLogs.length === 0 ? (
          <p className="text-[#8a8a8a] text-[0.8rem] m-0 italic">No activity records found.</p>
        ) : (
          <div className="max-h-[300px] overflow-y-auto flex flex-col gap-[8px]">
            {activityLogs.map(log => (
              <div key={log.id} className="flex justify-between items-center text-[0.8rem] text-[#d1d5db] border-b border-[#1a1a22] pb-[6px]">
                <div>
                  <span className="text-[#38bdf8] font-bold mr-[8px] text-[0.72rem] uppercase">
                    [{log.module || 'System'}]
                  </span>
                  <span>{log.action}</span>
                  {log.ip_address && <div className="text-[0.72rem] text-gray-500 mt-[2px]">IP: {log.ip_address}</div>}
                </div>
                <span className="text-[#8a8a8a] text-[0.72rem]">
                  {log.created_at ? new Date(log.created_at).toLocaleString('en-IN') : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Login History */}
      <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[8px] p-[18px]">
        <h4 className="text-[0.75rem] font-extrabold uppercase tracking-[0.6px] text-[#c084fc] m-0 mb-[12px] pb-[6px] border-b border-[#23232a]">
          Recent Login Attempts
        </h4>
        {loginHistory.length === 0 ? (
          <p className="text-[#8a8a8a] text-[0.8rem] m-0 italic">No login records found.</p>
        ) : (
          <div className="max-h-[250px] overflow-y-auto flex flex-col gap-[8px]">
            {loginHistory.map(log => (
              <div key={log.id} className="flex justify-between items-center text-[0.8rem] text-[#d1d5db] border-b border-[#1a1a22] pb-[6px]">
                <div>
                  <span className="text-white font-semibold">{log.browser || 'Browser'}</span> on <span className="text-[#a78bfa]">{log.device || 'Device'}</span>
                  <div className="text-[0.72rem] text-gray-500 mt-[2px]">IP: {log.ip_address || '—'}</div>
                </div>
                <span className="text-[#8a8a8a] text-[0.72rem]">
                  {log.login_at ? new Date(log.login_at).toLocaleString('en-IN') : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Quill toolbar modules — full-featured toolbar
const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
  ],
};

const QUILL_MODULES_COMPACT = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'clean'],
  ],
};

/**
 * RichTextEditor — full-featured Quill rich text editor with dark platform theme.
 * Props:
 *   value: string (HTML)
 *   onChange: (html: string) => void
 *   onBlur?: () => void
 *   placeholder?: string
 *   compact?: boolean  — use a smaller toolbar (for milestone descriptions)
 *   minHeight?: string — css min-height for the editor area (default '160px')
 */
export function RichTextEditor({ value, onChange, onBlur, placeholder, compact = false, minHeight = '160px' }) {
  return (
    <div className="gf-quill-wrapper" style={{ '--gf-editor-min-height': minHeight }}>
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        modules={compact ? QUILL_MODULES_COMPACT : QUILL_MODULES}
      />
    </div>
  );
}

/**
 * MultiAutocomplete — badge-based multi-select with suggestion dropdown and custom item addition.
 * Props:
 *   value: string[]         - current selected items
 *   onChange: (items: string[]) => void
 *   suggestions: string[]   - list of suggestions from backend
 *   placeholder?: string
 *   label?: string
 *   error?: string
 */
export function MultiAutocomplete({ value = [], onChange, suggestions = [], placeholder = 'Type to search or add...', label, error }) {
  const [inputVal, setInputVal] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = suggestions.filter(
    (s) => !value.includes(s) && s.toLowerCase().includes(inputVal.toLowerCase())
  );

  const showAddCustom =
    inputVal.trim().length > 0 &&
    !suggestions.map((s) => s.toLowerCase()).includes(inputVal.trim().toLowerCase()) &&
    !value.map((v) => v.toLowerCase()).includes(inputVal.trim().toLowerCase());

  const addItem = useCallback((item) => {
    const trimmed = item.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputVal('');
    setOpen(false);
    inputRef.current?.focus();
  }, [value, onChange]);

  const removeItem = (item) => {
    onChange(value.filter((v) => v !== item));
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && inputVal.trim()) {
      e.preventDefault();
      addItem(inputVal);
    } else if (e.key === 'Backspace' && !inputVal && value.length > 0) {
      onChange(value.slice(0, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setInputVal('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block mb-2">{label}</label>
      )}
      <div
        className={`min-h-[46px] flex flex-wrap gap-[6px] items-center rounded-[6px] border ${
          error ? 'border-red-500/80' : open ? 'border-[#70d64d]' : 'border-[#23232a]'
        } bg-[#0c0c0e] px-3 py-2 cursor-text transition-colors`}
        onClick={() => { inputRef.current?.focus(); setOpen(true); }}
      >
        {value.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 bg-[#70d64d18] border border-[#70d64d44] text-[#70d64d] rounded-[4px] px-[8px] py-[3px] text-[0.75rem] font-semibold shrink-0"
          >
            {item}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeItem(item); }}
              className="bg-transparent border-none text-[#70d64d] hover:text-white cursor-pointer p-0 ml-[2px] leading-none flex items-center"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); setOpen(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-white text-[0.85rem] outline-none border-none placeholder:text-gray-600"
        />
      </div>

      {error && <span className="text-red-400 text-xs mt-1 block">{error}</span>}

      {open && (filtered.length > 0 || showAddCustom) && (
        <div className="absolute z-[800] mt-[4px] w-full rounded-[8px] border border-[#23232a] bg-[#111114] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="max-h-[200px] overflow-y-auto py-1">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addItem(s); }}
                className="w-full text-left px-4 py-[10px] text-[0.85rem] text-gray-300 hover:bg-[#1e293b] hover:text-white transition-colors bg-transparent border-none cursor-pointer"
              >
                {s}
              </button>
            ))}
            {showAddCustom && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addItem(inputVal); }}
                className="w-full text-left px-4 py-[10px] text-[0.85rem] text-[#70d64d] hover:bg-[#70d64d18] transition-colors bg-transparent border-none cursor-pointer flex items-center gap-2 font-semibold border-t border-[#23232a]"
              >
                <Plus size={12} /> Add &quot;{inputVal.trim()}&quot;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SingleAutocomplete — searchable single-value dropdown with custom entry support.
 * Props:
 *   value: string           - current value
 *   onChange: (val: string) => void
 *   suggestions: string[]   - list of suggestions from backend
 *   placeholder?: string
 *   label?: string
 *   error?: string
 */
export function SingleAutocomplete({ value, onChange, suggestions = [], placeholder = 'Select or type...', label, error }) {
  const [inputVal, setInputVal] = useState(value || '');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setInputVal(value || '');
  }, [value]);

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(inputVal.toLowerCase())
  );

  const showAddCustom =
    inputVal.trim().length > 0 &&
    !suggestions.map((s) => s.toLowerCase()).includes(inputVal.trim().toLowerCase());

  const selectItem = (item) => {
    onChange(item);
    setInputVal(item);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setInputVal(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputVal.trim()) {
      e.preventDefault();
      selectItem(inputVal.trim());
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="text-gray-300 text-xs font-semibold uppercase tracking-wider block mb-2">{label}</label>
      )}
      <div className="relative">
        <input
          value={inputVal}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full rounded-[6px] border ${
            error ? 'border-red-500/80' : open ? 'border-[#70d64d]' : 'border-[#23232a]'
          } bg-[#0c0c0e] px-4 py-3 pr-10 text-white text-[0.85rem] outline-none transition-colors`}
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-gray-500 hover:text-white cursor-pointer p-0 flex items-center"
        >
          <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {error && <span className="text-red-400 text-xs mt-1 block">{error}</span>}

      {open && (filtered.length > 0 || showAddCustom) && (
        <div className="absolute z-[800] mt-[4px] w-full rounded-[8px] border border-[#23232a] bg-[#111114] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="max-h-[200px] overflow-y-auto py-1">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); selectItem(s); }}
                className={`w-full text-left px-4 py-[10px] text-[0.85rem] transition-colors bg-transparent border-none cursor-pointer ${
                  s === value
                    ? 'text-[#70d64d] bg-[#70d64d18] font-semibold'
                    : 'text-gray-300 hover:bg-[#1e293b] hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
            {showAddCustom && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); selectItem(inputVal.trim()); }}
                className="w-full text-left px-4 py-[10px] text-[0.85rem] text-[#70d64d] hover:bg-[#70d64d18] transition-colors bg-transparent border-none cursor-pointer flex items-center gap-2 font-semibold border-t border-[#23232a]"
              >
                <Plus size={12} /> Use &quot;{inputVal.trim()}&quot;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
