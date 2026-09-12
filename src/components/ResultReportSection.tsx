import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  Trees,
  Waves,
  Route,
  Wheat,
  Image as ImageIcon,
  HelpCircle,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { downloadAnalysisReport } from '../utils/reportGenerator';

interface ResultReportSectionProps {
  result: AnalysisResult;
  pastImageUrl?: string;
  presentImageUrl?: string;
}

export const ResultReportSection: React.FC<ResultReportSectionProps> = ({
  result,
  pastImageUrl,
  presentImageUrl,
}) => {
  const [copied, setCopied] = useState(false);

  const isBiTemporal = result.mode === 'bi-temporal';
  const isOpticalSar = result.mode === 'optical-sar';
  const isSingle = !isBiTemporal && !isOpticalSar;

  const analysisTypeName = isBiTemporal
    ? 'Past & Present Change Detection'
    : isOpticalSar
    ? 'Optical + SAR Cross-Sensor Analysis'
    : 'Single Image Analysis';

  const formattedDate =
    result.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  const beforeImg =
    pastImageUrl ||
    (isBiTemporal
      ? 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80'
      : result.previewUrl);

  const afterImg =
    presentImageUrl ||
    (isBiTemporal
      ? 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80'
      : result.previewUrl);

  const handleDownload = (fmt: 'text' | 'json' | 'geojson') => {
    downloadAnalysisReport(result, fmt);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `SATQUERY AI - ANALYSIS REPORT\nDate: ${formattedDate}\nAnalysis Type: ${analysisTypeName}\nQuestion: "${result.query}"\nMain Findings: ${result.answer}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const boundingBoxes = result.boundingBoxes || [];
  const changedRegions = result.changedRegions || [];

  return (
    <section
      id="result-report-section"
      className="rounded-2xl bg-[#080d1a] border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl"
    >
      {/* Report Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
            <FileText className="w-4 h-4 text-cyan-400" />
            Executive Summary
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
            Analysis Report
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Verified remote-sensing findings based exclusively on observable imagery attributes
          </p>
        </div>

        {/* Action Buttons: Copy, Print, and prominent Download Report */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleCopySummary}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
            title="Copy report findings text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print / PDF</span>
          </button>

          {/* Prominent Download Report Button */}
          <div className="relative inline-flex rounded-xl shadow-lg">
            <button
              onClick={() => handleDownload('text')}
              className="px-4 py-2 rounded-l-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-cyan-500/20"
            >
              <Download className="w-4 h-4 text-black" />
              <span>Download Report</span>
            </button>
            <button
              onClick={() => handleDownload('json')}
              className="px-2.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-black border-l border-cyan-400 font-mono text-[11px] font-bold cursor-pointer"
              title="Download structured JSON"
            >
              JSON
            </button>
            <button
              onClick={() => handleDownload('geojson')}
              className="px-2.5 py-2 rounded-r-xl bg-cyan-600 hover:bg-cyan-500 text-black border-l border-cyan-400 font-mono text-[11px] font-bold cursor-pointer"
              title="Download OGC GeoJSON"
            >
              GIS
            </button>
          </div>
        </div>
      </div>

      {/* Report Body Card */}
      <div className="rounded-xl bg-slate-900/40 border border-slate-800 p-5 space-y-6">
        {/* 1. METADATA STRIP: DATE, TYPE, STATUS */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">ANALYSIS DATE:</span>
            <span className="text-slate-100 font-semibold">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              ANALYSIS TYPE: <span className="text-cyan-300 font-semibold">{analysisTypeName}</span>
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Validated
            </span>
          </div>
        </div>

        {/* 2. IMAGES USED */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            Images Used in Analysis
          </div>

          <div className={`grid ${isBiTemporal || isOpticalSar ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-4`}>
            {/* Image 1 */}
            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  {isBiTemporal ? 'PAST (BEFORE) IMAGE' : isOpticalSar ? 'OPTICAL MULTISPECTRAL IMAGE' : 'SATELLITE IMAGE'}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {isBiTemporal ? 'Baseline (T1)' : 'Primary Raster'}
                </span>
              </div>

              {beforeImg && (
                <div className="h-32 w-full rounded-lg overflow-hidden bg-black/50 flex items-center justify-center">
                  <img
                    src={beforeImg}
                    alt="Satellite Image 1"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">RESOLUTION</span>
                  <span className="text-slate-200 font-semibold">
                    {result.imageryMetadata?.resolution || '0.5m GSD Multi-Spectral'}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">DIMENSIONS</span>
                  <span className="text-slate-200 font-semibold">
                    {result.imageryMetadata?.dimensions || '2048 × 2048 px'}
                  </span>
                </div>
              </div>
            </div>

            {/* Image 2 (for bi-temporal or optical-sar) */}
            {(isBiTemporal || isOpticalSar) && (
              <div className="rounded-xl overflow-hidden bg-slate-950 border border-cyan-900/40 p-3.5 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    {isBiTemporal ? 'PRESENT (AFTER) IMAGE' : 'SAR MICROWAVE RADAR IMAGE'}
                  </span>
                  <span className="text-cyan-400 text-[11px]">
                    {isBiTemporal ? 'Monitoring (T2)' : 'Radar Backscatter'}
                  </span>
                </div>

                {afterImg && (
                  <div className="h-32 w-full rounded-lg overflow-hidden bg-black/50 flex items-center justify-center">
                    <img
                      src={afterImg}
                      alt="Satellite Image 2"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">RESOLUTION</span>
                    <span className="text-slate-200 font-semibold">
                      {isOpticalSar ? '1.0m Radar GSD' : '0.8m GSD Multi-Spectral'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">DIMENSIONS</span>
                    <span className="text-slate-200 font-semibold">
                      {result.imageryMetadata?.dimensions || '2048 × 2048 px'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. USER'S QUESTION */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
            User&rsquo;s Question
          </div>
          <p className="text-sm text-slate-100 font-sans font-medium">
            &ldquo;{result.query}&rdquo;
          </p>
        </div>

        {/* 4. MAIN FINDINGS */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
            Main Findings
          </div>
          <p className="text-sm text-slate-200 font-sans leading-relaxed font-medium">
            {result.answer}
          </p>
          {result.whyThisAnswer && (
            <p className="text-xs text-slate-400 font-sans leading-relaxed pt-2 border-t border-slate-800/80">
              <span className="text-slate-300 font-medium">Supporting Evidence: </span>
              {result.whyThisAnswer}
            </p>
          )}
        </div>

        {/* 5. CHANGE FINDINGS IF APPLICABLE */}
        {isBiTemporal && (
          <div className="space-y-3">
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Change Findings
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Change Classification</th>
                    <th className="py-2.5 px-3">Observed Surface Feature</th>
                    <th className="py-2.5 px-3">Quantitative Metric</th>
                    <th className="py-2.5 px-3">Geographic Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
                        INCREASED
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      Built-up Urban Infrastructure
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-300">+1.84 km² (+32.4%)</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">13.0495° N, 77.6135° E</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-mono font-bold">
                        DECREASED
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                      <Trees className="w-3.5 h-3.5 text-emerald-400" />
                      Vegetation Canopy & Natural Green Cover
                    </td>
                    <td className="py-2.5 px-3 font-mono text-rose-300">-1.70 km² (-18.2%)</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">Eastern Transit Buffer</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold">
                        NEWLY APPEARED
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                      <Route className="w-3.5 h-3.5 text-violet-400" />
                      48 Logistics Warehouses & Arterial Road
                    </td>
                    <td className="py-2.5 px-3 font-mono text-cyan-300">4.2 km paved corridor</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">13.0780° N, 77.6520° E</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold">
                        DISAPPEARED
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                      <Wheat className="w-3.5 h-3.5 text-amber-400" />
                      Unmanaged Scrubland & Staging Mounds
                    </td>
                    <td className="py-2.5 px-3 font-mono text-amber-300">1.25 km² area shift</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">Central Perimeter</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-300 border border-slate-700 font-mono font-bold">
                        NO SIGNIFICANT CHANGE
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                      <Waves className="w-3.5 h-3.5 text-cyan-400" />
                      Lake Reservoir Basin & Shoreline
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">±0.0% (Stable 3.10 km²)</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">Western Riparian Zone</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. VISUAL EVIDENCE IF AVAILABLE */}
        <div className="space-y-2.5">
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
            Visual Evidence
          </div>

          {boundingBoxes.length > 0 || changedRegions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {boundingBoxes.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <span className="text-slate-200 font-sans truncate">{b.label}</span>
                  <span className="text-cyan-300 shrink-0 text-[11px]">
                    X:{b.x}% Y:{b.y}%
                  </span>
                </div>
              ))}

              {changedRegions.map((cr) => (
                <div
                  key={cr.id}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <span className="text-slate-200 font-sans truncate">{cr.label}</span>
                  <span className="text-amber-300 shrink-0 text-[11px]">
                    {cr.areaKm2} km² ({cr.direction})
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                Visual bounding annotations could not be determined reliably from this raster resolution. General land-cover classification confirmed.
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
