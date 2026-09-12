import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Columns,
  Layers,
  Sparkles,
  Move,
  Sliders,
} from 'lucide-react';
import { ChangedRegion, BoundingBox } from '../types';

interface SideBySideViewerProps {
  pastImageUrl: string;
  presentImageUrl: string;
  pastLabel?: string;
  presentLabel?: string;
  pastDate?: string;
  presentDate?: string;
  changedRegions?: ChangedRegion[];
  boundingBoxes?: BoundingBox[];
  changeMetric?: any;
  showOverlayDefault?: boolean;
  focusedEvidenceId?: string | null;
  onSelectEvidence?: (id: string) => void;
}

export type ComparisonControlMode = 'side-by-side' | 'change-view' | 'overlay';

export const SideBySideViewer: React.FC<SideBySideViewerProps> = ({
  pastImageUrl,
  presentImageUrl,
  pastLabel = 'PAST / BEFORE',
  presentLabel = 'PRESENT / AFTER',
  pastDate = 'Baseline Acquisition',
  presentDate = 'Monitoring Acquisition',
  changedRegions = [],
  boundingBoxes = [],
  focusedEvidenceId,
  onSelectEvidence,
}) => {
  const [controlMode, setControlMode] = useState<ComparisonControlMode>('side-by-side');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(50);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronized Pan & Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(Math.max(0.75, prev + delta), 4.0));
  };

  const resetTransform = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const hasSpatialEvidence = changedRegions.length > 0 || boundingBoxes.length > 0;
  const showChangeOverlays = controlMode === 'change-view';

  return (
    <div
      id="side-by-side-viewer"
      className="rounded-2xl bg-[#080d1a] border border-slate-800 overflow-hidden shadow-2xl flex flex-col"
    >
      {/* ------------------------------------------------------------- */}
      {/* MAIN IMAGERY STAGE */}
      {/* ------------------------------------------------------------- */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`relative w-full h-[460px] sm:h-[540px] bg-[#03060f] overflow-hidden select-none cursor-grab active:cursor-grabbing ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
      >
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 tech-grid-bg opacity-15 pointer-events-none" />

        {controlMode === 'overlay' ? (
          /* ========================================================= */
          /* OVERLAY COMPARISON MODE (TRANSPARENCY BLEND)             */
          /* ========================================================= */
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Base Past / Before Image */}
            <div
              className="absolute inset-0 flex items-center justify-center origin-center transition-transform duration-75 ease-out"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              <div className="relative flex items-center justify-center h-[90%] w-[90%]">
                <img
                  src={pastImageUrl}
                  alt={pastLabel}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-xl"
                  draggable={false}
                />

                {/* Overlaid Present / After Image with Adjustable Transparency */}
                <div
                  className="absolute inset-0 flex items-center justify-center transition-opacity duration-150"
                  style={{ opacity: overlayOpacity / 100 }}
                >
                  <img
                    src={presentImageUrl}
                    alt={presentLabel}
                    className="max-h-full max-w-full object-contain rounded-lg"
                    draggable={false}
                  />
                </div>
              </div>
            </div>

            {/* Permanent Overlay Indicators */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-slate-950/90 border border-cyan-500/60 backdrop-blur-md shadow-lg flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs text-cyan-300">
                  OVERLAY BLEND MODE
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {overlayOpacity}% Present / {100 - overlayOpacity}% Past
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* SIDE-BY-SIDE PANELS (DEFAULT & CHANGE VIEW)               */
          /* Two large equal-sized panels horizontally adjacent        */
          /* ========================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 h-full w-full divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
            {/* PANEL 1: PAST / BEFORE */}
            <div className="relative h-full overflow-hidden bg-slate-950/30 flex items-center justify-center">
              {/* Permanent Label: PAST / BEFORE */}
              <div className="absolute top-3 left-3 z-20 px-3.5 py-2 rounded-xl bg-slate-950/95 border border-slate-700 shadow-xl backdrop-blur-md">
                <div className="font-bold text-xs text-slate-100 flex items-center gap-2 tracking-wide">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block shadow-sm" />
                  <span>{pastLabel}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {pastDate}
                </div>
              </div>

              {/* Synchronized Pan/Zoom Canvas */}
              <div
                className="w-full h-full flex items-center justify-center origin-center transition-transform duration-75 ease-out"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                }}
              >
                <div className="relative flex items-center justify-center h-[90%] w-[90%]">
                  <img
                    src={pastImageUrl}
                    alt={pastLabel}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-xl"
                    draggable={false}
                  />
                </div>
              </div>
            </div>

            {/* PANEL 2: PRESENT / AFTER */}
            <div className="relative h-full overflow-hidden bg-slate-950/30 flex items-center justify-center">
              {/* Permanent Label: PRESENT / AFTER */}
              <div className="absolute top-3 left-3 z-20 px-3.5 py-2 rounded-xl bg-slate-950/95 border border-cyan-500/80 shadow-xl backdrop-blur-md">
                <div className="font-bold text-xs text-cyan-300 flex items-center gap-2 tracking-wide">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse inline-block shadow-sm shadow-cyan-400/50" />
                  <span>{presentLabel}</span>
                </div>
                <div className="text-[10px] text-cyan-400/90 font-mono mt-0.5">
                  {presentDate}
                </div>
              </div>

              {/* Synchronized Pan/Zoom Canvas with Spatial Change Highlights */}
              <div
                className="w-full h-full flex items-center justify-center origin-center transition-transform duration-75 ease-out relative"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                }}
              >
                <div className="relative flex items-center justify-center h-[90%] w-[90%]">
                  <img
                    src={presentImageUrl}
                    alt={presentLabel}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-xl"
                    draggable={false}
                  />

                  {/* VISUAL EVIDENCE OVERLAYS (Shown in Change View or if enabled) */}
                  {showChangeOverlays && hasSpatialEvidence && (
                    <div className="absolute inset-0 pointer-events-none">
                      {changedRegions.map((region) => {
                        const isFocused = focusedEvidenceId === region.id;
                        return (
                          <div
                            key={region.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEvidence?.(region.id);
                            }}
                            className={`absolute border-2 pointer-events-auto cursor-pointer rounded transition-all duration-200 ${
                              isFocused
                                ? 'border-4 border-amber-300 bg-amber-500/35 ring-4 ring-amber-400/50 z-30 shadow-[0_0_20px_rgba(251,191,36,0.8)] scale-105'
                                : 'border-amber-400/90 bg-amber-500/25 shadow-[0_0_12px_rgba(251,191,36,0.6)] z-20 hover:bg-amber-500/35'
                            }`}
                            style={{
                              left: `${region.x}%`,
                              top: `${region.y}%`,
                              width: `${region.width}%`,
                              height: `${region.height}%`,
                            }}
                          >
                            <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-500/60 shadow whitespace-nowrap">
                              {region.label} ({region.direction || 'Changed'})
                            </span>
                          </div>
                        );
                      })}

                      {boundingBoxes.map((b) => {
                        const isFocused = focusedEvidenceId === b.id;
                        return (
                          <div
                            key={b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEvidence?.(b.id);
                            }}
                            className={`absolute border-2 pointer-events-auto cursor-pointer rounded transition-all duration-200 ${
                              isFocused
                                ? 'border-4 border-cyan-300 bg-cyan-500/35 ring-4 ring-cyan-400/50 z-30 shadow-[0_0_20px_rgba(6,182,212,0.8)] scale-105'
                                : 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.4)] z-20 hover:bg-cyan-500/30'
                            }`}
                            style={{
                              left: `${b.x}%`,
                              top: `${b.y}%`,
                              width: `${b.width}%`,
                              height: `${b.height}%`,
                            }}
                          >
                            <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-500/60 shadow whitespace-nowrap">
                              {b.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pan instruction hint */}
        <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-md bg-slate-950/85 border border-slate-800 text-[10px] font-mono text-slate-400 pointer-events-none flex items-center gap-1.5 backdrop-blur-sm">
          <Move className="w-3 h-3 text-cyan-400" />
          <span>Click & drag to pan • Scroll to zoom</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SIMPLE COMPARISON CONTROLS (PLACED DIRECTLY BELOW IMAGES)     */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 bg-slate-900/95 border-t border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Comparison Mode Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
          {/* 1. Side-by-Side (Default) */}
          <button
            onClick={() => setControlMode('side-by-side')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
              controlMode === 'side-by-side'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Columns className="w-4 h-4" />
            <span>Side-by-Side</span>
          </button>

          {/* 2. Change View */}
          <button
            onClick={() => setControlMode('change-view')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
              controlMode === 'change-view'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Change View</span>
          </button>

          {/* 3. Overlay */}
          <button
            onClick={() => setControlMode('overlay')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
              controlMode === 'overlay'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Overlay</span>
          </button>
        </div>

        {/* Dynamic Context Controls based on active mode */}
        {controlMode === 'overlay' ? (
          <div className="flex-1 max-w-md flex items-center gap-3 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
              Past (0%)
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="text-[11px] font-mono text-cyan-300 whitespace-nowrap">
              Present (100%)
            </span>
            <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
              <button
                onClick={() => setOverlayOpacity(0)}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-300 hover:text-white"
                title="Past Only"
              >
                Past
              </button>
              <button
                onClick={() => setOverlayOpacity(50)}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900"
                title="50% Blend"
              >
                50%
              </button>
              <button
                onClick={() => setOverlayOpacity(100)}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-300 hover:text-white"
                title="Present Only"
              >
                Present
              </button>
            </div>
          </div>
        ) : controlMode === 'change-view' ? (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            {hasSpatialEvidence ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-700/50 text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                Detected change zones highlighted in amber
              </span>
            ) : (
              <span className="text-slate-400 text-xs">
                No spatial bounds generated for this query. Review findings below.
              </span>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-sans hidden md:block">
            Synchronized pan & zoom keeps both views locked to the exact same location.
          </div>
        )}

        {/* Zoom & Reset Controls */}
        <div className="flex items-center justify-end gap-1.5">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono text-slate-200 min-w-[44px] text-center font-semibold">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(4.0, z + 0.25))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={resetTransform}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition ml-1"
              title="Reset Zoom & Pan"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
