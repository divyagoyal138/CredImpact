'use client'

import { useState, useRef, useEffect } from 'react'
import {
  exportAnalyticsToPDF,
  exportAnalyticsToWord,
  exportAnalyticsToPowerPoint,
  exportAnalyticsToCSV,
  AnalyticsExportData
} from '@/lib/exportUtils'

interface ExportDropdownProps {
  getExportData: () => AnalyticsExportData;
  label?: string;
  className?: string;
}

export default function ExportDropdown({ getExportData, label = 'Save As...', className = '' }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExport = (type: 'pdf' | 'word' | 'ppt' | 'csv') => {
    setIsOpen(false)
    const data = getExportData()

    switch (type) {
      case 'pdf':
        exportAnalyticsToPDF(data)
        break
      case 'word':
        exportAnalyticsToWord(data)
        break
      case 'ppt':
        exportAnalyticsToPowerPoint(data)
        break
      case 'csv':
        exportAnalyticsToCSV(data)
        break
    }
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all cursor-pointer ${className}`}
        aria-expanded={isOpen}
      >
        <i className="ti ti-download text-base" aria-hidden="true" />
        <span>{label}</span>
        <i className={`ti ti-chevron-down text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-border bg-popover p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in-80 zoom-in-95">
          <div className="px-3 py-2 border-b border-border/60 mb-1">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Export Report As</p>
          </div>

          <button
            onClick={() => handleExport('pdf')}
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground rounded-xl hover:bg-secondary transition-colors group cursor-pointer"
          >
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
              <i className="ti ti-file-type-pdf text-base" aria-hidden="true" />
            </span>
            <div>
              <div className="font-bold">PDF Document</div>
              <div className="text-[10px] text-muted-foreground font-normal">Formatted print report (.pdf)</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('word')}
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground rounded-xl hover:bg-secondary transition-colors group cursor-pointer"
          >
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <i className="ti ti-file-type-doc text-base" aria-hidden="true" />
            </span>
            <div>
              <div className="font-bold">Word Document</div>
              <div className="text-[10px] text-muted-foreground font-normal">Editable report (.docx)</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('ppt')}
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground rounded-xl hover:bg-secondary transition-colors group cursor-pointer"
          >
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <i className="ti ti-[#d97706] ti-file-type-ppt text-base" aria-hidden="true" />
            </span>
            <div>
              <div className="font-bold">PowerPoint Deck</div>
              <div className="text-[10px] text-muted-foreground font-normal">Slide presentation (.pptx)</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground rounded-xl hover:bg-secondary transition-colors group cursor-pointer mt-0.5 border-t border-border/50 pt-2"
          >
            <span className="p-1.5 rounded-lg bg-green-500/10 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
              <i className="ti ti-file-spreadsheet text-base" aria-hidden="true" />
            </span>
            <div>
              <div className="font-bold">CSV Spreadsheet</div>
              <div className="text-[10px] text-muted-foreground font-normal">Raw data export (.csv)</div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
