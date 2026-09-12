import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  FileText,
  Trash2,
  RefreshCw,
  GitCompare,
  Satellite,
  CheckCircle2,
} from 'lucide-react';
import { AnalysisResult, HistoryItem } from '../types';
import { downloadAnalysisReport } from '../utils/reportGenerator';
import { fetchHistory, deleteJobApi } from '../services/api';

interface HistoryViewProps {
  historyItems: HistoryItem[];
  onLoadHistoryItem: (result: AnalysisResult) => void;
  onOpenReportModal: (result: AnalysisResult) => void;
  onRefreshHistory?: () => void;
  onClearHistory?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  historyItems: propHistoryItems,
  onLoadHistoryItem,
  onOpenReportModal,
  onRefreshHistory,
  onClearHistory,
}) => {
  const [items, setItems] = useState<HistoryItem[]>(propHistoryItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync prop changes
  useEffect(() => {
    setItems(propHistoryItems);
  }, [propHistoryItems]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await fetchHistory();
      if (fresh && fresh.length > 0) {
        setItems(fresh);
      }
      onRefreshHistory?.();
    } catch (err) {
      console.warn('History refresh warning:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteJobApi(id);
    } catch {
      // client-side fallback
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleDownload = (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    if (item.result) {
      downloadAnalysisReport(item.result, 'json');
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const itemDate = item.date || '';
    const matchesSearch =
      item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.result?.answer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.analysisType.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedType === 'ALL') return true;
    const mode = item.result?.mode;
    const typeStr = item.analysisType.toLowerCase();
    if (selectedType === 'single' && (mode === 'single' || typeStr.includes('single') || typeStr.includes('vqa'))) return true;
    if (selectedType === 'compare' && (mode === 'bi-temporal' || typeStr.includes('bi-temporal') || typeStr.includes('change') || typeStr.includes('present'))) return true;
    if (selectedType === 'optical-sar' && (mode === 'optical-sar' || typeStr.includes('sar') || typeStr.includes('optical'))) return true;

    return false;
  });

  const getTypeBadge = (item: HistoryItem) => {
    const mode = item.result?.mode;
    const typeStr = (item.analysisType || '').toLowerCase();
    if (mode === 'bi-temporal' || typeStr.includes('bi-temporal') || typeStr.includes('change') || typeStr.includes('present')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
          <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
          Past & Present Comparison
        </span>
      );
    }
    if (mode === 'optical-sar' || typeStr.includes('sar') || typeStr.includes('optical')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-950/80 text-blue-300 border border-blue-700/60">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          Optical + SAR
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
        <Satellite className="w-3.5 h-3.5 text-slate-400" />
        Single Image
      </span>
    );
  };

  return (
    <div id="history-page" className="max-w-5xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 font-sans">
            Analysis History
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Access previous satellite analyses, view change maps, and download reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs font-medium text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
            title="Refresh past analyses"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {items.length > 0 && onClearHistory && (
            <button
              onClick={onClearHistory}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs font-medium text-slate-400 hover:text-rose-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by query, location, or summary keywords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Analyses' },
            { id: 'compare', label: 'Past & Present' },
            { id: 'single', label: 'Single Image' },
            { id: 'optical-sar', label: 'Optical + SAR' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis List / Card Layout */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <History className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">
            No analyses found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? 'No historical records match your search filter. Try clearing your query.'
              : 'You have not run any satellite analyses yet. Start by uploading satellite imagery.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const hasResult = !!item.result;
            const summaryText =
              item.result?.summary ||
              item.result?.answer ||
              'Analysis completed successfully.';

            return (
              <div
                key={item.id}
                className="group p-5 sm:p-6 rounded-2xl bg-[#080d1a]/85 hover:bg-[#0a1122] border border-slate-800/90 hover:border-cyan-500/40 transition-all duration-200 shadow-md hover:shadow-cyan-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
              >
                {/* Left side: Metadata & Content */}
                <div className="space-y-3 flex-1 min-w-0">
                  {/* Top line: Date and Type badge */}
                  <div className="flex flex-wrap items-center gap-3">
                    {getTypeBadge(item)}

                    <span className="flex items-center gap-1.5 text-xs text-slate-400 font-sans">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {item.date}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Completed
                    </span>
                  </div>

                  {/* Short Query */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2">
                      &ldquo;{item.query}&rdquo;
                    </h3>
                  </div>

                  {/* Summary finding */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {summaryText}
                  </p>

                  {/* Visual Features tag if available */}
                  {item.result?.detectedFeatures && item.result.detectedFeatures.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {item.result.detectedFeatures.slice(0, 4).map((f) => (
                        <span
                          key={f.id}
                          className="px-2 py-0.5 rounded text-[11px] bg-slate-900 border border-slate-800 text-slate-400"
                        >
                          {f.label}
                        </span>
                      ))}
                      {item.result.detectedFeatures.length > 4 && (
                        <span className="text-[10px] text-slate-500">
                          +{item.result.detectedFeatures.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side: Action Buttons */}
                <div className="flex sm:flex-col items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  {/* View Result Button */}
                  <button
                    onClick={() => {
                      if (item.result) {
                        onLoadHistoryItem(item.result);
                      }
                    }}
                    className="flex-1 sm:w-36 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Result</span>
                  </button>

                  {/* Download Report Button */}
                  <button
                    onClick={(e) => handleDownload(e, item)}
                    className="flex-1 sm:w-36 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Download structured report"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download Report</span>
                  </button>

                  {/* Delete Item */}
                  <button
                    onClick={(e) => handleDeleteItem(e, item.id)}
                    className="p-2 rounded-xl hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition cursor-pointer self-center"
                    title="Remove from history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
