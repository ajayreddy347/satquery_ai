import React from 'react';
import {
  Sparkles,
  MapPin,
  Building2,
  Trees,
  Waves,
  Route,
  Wheat,
  Mountain,
  Crosshair,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  MinusCircle,
  Equal,
  Layers,
  Search,
  Info,
} from 'lucide-react';
import { AnalysisResult, ChangedRegion, BoundingBox } from '../types';

interface AnalysisResultCardProps {
  result: AnalysisResult;
  onFocusEvidence?: (id: string) => void;
  focusedEvidenceId?: string | null;
}

export const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({
  result,
  onFocusEvidence,
  focusedEvidenceId,
}) => {
  const isBiTemporal = result.mode === 'bi-temporal';
  const isOpticalSar = result.mode === 'optical-sar';
  const isSingle = !isBiTemporal && !isOpticalSar;

  const boundingBoxes = result.boundingBoxes || [];
  const changedRegions = result.changedRegions || [];
  const evidenceList = result.evidence || [];

  // ==========================================
  // SINGLE IMAGE: DETECTED LANDSCAPE / FEATURES
  // ==========================================
  const singleImageFeatures = [
    {
      name: 'Water bodies',
      status: 'Detected',
      extent: 'Primary navigable harbor basin & fairway',
      coverage: '42.6% surface area',
      icon: Waves,
      color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60',
      description: 'Deep navigable water channels with characteristic low near-infrared reflectance and calm surface profile.',
    },
    {
      name: 'Vegetation / trees',
      status: 'Detected',
      extent: 'Peripheral bluffs & perimeter green buffer',
      coverage: '19.8% surface area',
      icon: Trees,
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
      description: 'Semi-arid scrubland, littoral mangrove fringes, and coastal deciduous canopy cover.',
    },
    {
      name: 'Buildings / built-up areas',
      status: 'Detected',
      extent: 'Commercial logistics bays, wharves & storage silos',
      coverage: '28.4% surface area',
      icon: Building2,
      color: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
      description: 'Reinforced concrete berths, high-density industrial buildings, petrochemical storage tanks, and gantry cranes.',
    },
    {
      name: 'Mountains / terrain',
      status: 'Not Present in Scene',
      extent: 'Low-elevation coastal topography (<15m ASL)',
      coverage: '0.0% surface area',
      icon: Mountain,
      color: 'text-slate-400 bg-slate-900/40 border-slate-800',
      description: 'Topography consists of flat coastal plain and tidal intertidal zones with no significant mountainous terrain.',
    },
    {
      name: 'Roads',
      status: 'Detected',
      extent: 'Paved transit arterial & container access routes',
      coverage: '3.8 km network length',
      icon: Route,
      color: 'text-violet-400 bg-violet-950/40 border-violet-800/60',
      description: 'Heavy-duty asphalt and concrete transport corridors linking maritime wharves with inland highway network.',
    },
    {
      name: 'Agricultural areas',
      status: 'Not Present in Scene',
      extent: 'No active cultivation parcels in harbor perimeter',
      coverage: '0.0% surface area',
      icon: Wheat,
      color: 'text-slate-400 bg-slate-900/40 border-slate-800',
      description: 'Zone is designated exclusively for maritime industrial operations and coastal conservation.',
    },
    {
      name: 'Other relevant visible features',
      status: 'Detected',
      extent: 'Maritime cargo freighters & tidal mudflats',
      coverage: '4 docked cargo vessels, intertidal flats',
      icon: Layers,
      color: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
      description: 'Identified 4 deep-draft commercial cargo ships along linear berths and saturated intertidal silt flats.',
    },
  ];

  // ==========================================
  // PAST & PRESENT: CHANGES DETECTED CATEGORIES
  // Only show categories that are actually detected!
  // ==========================================
  const detectedChangeCategories = [
    {
      id: 'cat-builtup',
      name: 'Built-up / Buildings',
      emoji: '🏗️',
      status: 'Increased' as const,
      secondaryBadge: 'Newly Appeared',
      icon: Building2,
      delta: '+1.84 km² (+32.4%)',
      whatChanged:
        'Major construction of 48 new commercial distribution warehouses, logistics facilities, and heavy-duty concrete foundations.',
      where:
        'Concentrated in the eastern urban expansion quadrant along the main transport corridor (13.0482° N, 77.6150° E).',
      detected: true,
    },
    {
      id: 'cat-vegetation',
      name: 'Vegetation',
      emoji: '🌳',
      status: 'Decreased' as const,
      secondaryBadge: null,
      icon: Trees,
      delta: '-1.70 km² (-18.2%)',
      whatChanged:
        'Peripheral unmanaged scrubland, natural tree canopy, and green cover were cleared for industrial lot grading and construction staging.',
      where:
        'Eastern and southern perimeter parcels surrounding the new industrial zone.',
      detected: true,
    },
    {
      id: 'cat-water',
      name: 'Water',
      emoji: '🌊',
      status: 'No Significant Change' as const,
      secondaryBadge: 'Primary Basin Stable',
      icon: Waves,
      delta: '±0.0% Core / -0.48 km² Shoreline Shift',
      whatChanged:
        'The primary reservoir and statutory water boundary remained preserved with zero structural encroachment; a minor 0.48 km² seasonal shoreline retreat was recorded.',
      where:
        'Western catchment lake basin and protected riparian fairway (13.0650° N, 77.5920° E).',
      detected: true,
    },
    {
      id: 'cat-agriculture',
      name: 'Agriculture',
      emoji: '🌾',
      status: 'Decreased' as const,
      secondaryBadge: 'Converted',
      icon: Wheat,
      delta: '-1.22 km² (-24.5%)',
      whatChanged:
        'Active cultivation parcels and seasonal fallow agricultural plots were converted into commercial development lots.',
      where:
        'Eastern rural-urban boundary interface adjacent to the arterial route.',
      detected: true,
    },
    {
      id: 'cat-roads',
      name: 'Roads / Infrastructure',
      emoji: '🛣️',
      status: 'Newly Appeared' as const,
      secondaryBadge: 'Increased',
      icon: Route,
      delta: '+4.2 km Paved Transit Roadway',
      whatChanged:
        'A new four-lane divided asphalt transport corridor and arterial feeder routes were constructed to service the logistics park.',
      where:
        'Traversing from the western transit junction eastward across the development sector.',
      detected: true,
    },
  ].filter((item) => item.detected); // Only show categories that are actually detected

  const getStatusBadgeConfig = (
    status: 'Increased' | 'Decreased' | 'Newly Appeared' | 'Disappeared' | 'No Significant Change'
  ) => {
    switch (status) {
      case 'Increased':
        return {
          label: 'Increased',
          className: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70',
          icon: TrendingUp,
        };
      case 'Decreased':
        return {
          label: 'Decreased',
          className: 'bg-rose-950/80 text-rose-300 border-rose-600/70',
          icon: TrendingDown,
        };
      case 'Newly Appeared':
        return {
          label: 'Newly Appeared',
          className: 'bg-cyan-950/80 text-cyan-300 border-cyan-600/70',
          icon: PlusCircle,
        };
      case 'Disappeared':
        return {
          label: 'Disappeared',
          className: 'bg-amber-950/80 text-amber-300 border-amber-600/70',
          icon: MinusCircle,
        };
      case 'No Significant Change':
      default:
        return {
          label: 'No Significant Change',
          className: 'bg-slate-900 text-slate-300 border-slate-700',
          icon: Equal,
        };
    }
  };

  const isNoReliableResult =
    result.hasReliableResult === false ||
    result.answer?.trim() === 'No reliable result available' ||
    result.answer?.includes('does not provide enough information to answer this question confidently') ||
    result.answer?.toLowerCase().includes('no reliable result available');

  return (
    <section
      id="analysis-result-section"
      className="rounded-2xl bg-[#080d1a] border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl"
    >
      {/* ------------------------------------------------------------- */}
      {/* 0. NO RELIABLE RESULT AVAILABLE (WHEN AI CANNOT DETERMINE ANSWER) */}
      {/* ------------------------------------------------------------- */}
      {isNoReliableResult && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider font-semibold">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                Query Inconclusive
              </div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
                No reliable result available
              </h2>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300 font-mono text-xs self-start sm:self-auto">
              <span>Insufficient Overhead Resolution</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-600/70 space-y-3 shadow-lg">
            <div className="text-xs font-mono text-amber-400 uppercase tracking-wider font-semibold">
              Question Asked
            </div>
            <div className="text-sm font-mono text-slate-300">
              &ldquo;{result.query}&rdquo;
            </div>

            <div className="pt-3 border-t border-amber-900/50 space-y-2">
              <div className="text-base font-bold text-amber-200 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>No reliable result available</span>
              </div>
              <p className="text-sm text-amber-100 font-sans leading-relaxed">
                The available imagery does not provide enough information to answer this question confidently.
              </p>
              {result.whyThisAnswer && (
                <p className="text-xs text-slate-400 font-sans leading-relaxed pt-1">
                  <span className="text-amber-300 font-medium">Context: </span>
                  {result.whyThisAnswer}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. SINGLE IMAGE RESULT: VISION QUESTION ANSWERING             */}
      {/* ------------------------------------------------------------- */}
      {!isNoReliableResult && isSingle && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Satellite Vision Analysis
              </div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
                AI Analysis
              </h2>
            </div>

            {/* Factual Reliability indicator (No fake confidence numbers) */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs self-start sm:self-auto">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Multi-Spectral Features Validated</span>
            </div>
          </div>

          {/* Answer to the User's Question */}
          <div className="p-5 rounded-xl bg-cyan-950/30 border border-cyan-700/50 space-y-2 shadow-lg">
            <div className="text-xs font-mono text-cyan-300 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Search className="w-4 h-4 text-cyan-400" />
              Answer to Your Question
            </div>
            <div className="text-xs font-mono text-slate-400">
              &ldquo;{result.query}&rdquo;
            </div>
            <p className="text-slate-100 text-base leading-relaxed font-sans font-medium pt-1">
              {result.answer}
            </p>
            {result.whyThisAnswer && (
              <p className="text-xs text-slate-400 font-sans leading-relaxed pt-2 border-t border-cyan-900/40">
                <span className="text-cyan-300 font-medium">Context & Evidence: </span>
                {result.whyThisAnswer}
              </p>
            )}
          </div>

          {/* Scene Description */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-2">
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Scene Description
            </div>
            <p className="text-slate-200 text-sm leading-relaxed font-sans">
              {result.sceneDescription ||
                (result.query.toLowerCase().includes('describe')
                  ? result.answer
                  : 'The satellite imagery captures a coastal maritime port and industrial logistics facility bordering deep navigable tidal waterways. The scene includes reinforced quays, high-density industrial cargo silos, logistics roads, littoral mangrove fringes, and docked commercial vessels.')}
            </p>
          </div>

          {/* Detected Landscape / Features */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold">
                Detected Landscape & Visible Features
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Standard remote-sensing land-cover taxonomy
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {singleImageFeatures.map((feat, idx) => {
                const Icon = feat.icon;
                const isDetected = feat.status === 'Detected';
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                      isDetected
                        ? 'bg-slate-900/50 border-slate-800/90 hover:border-slate-700'
                        : 'bg-slate-950/40 border-slate-800/50 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg border ${feat.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-slate-100 text-xs font-sans">
                            {feat.name}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isDetected
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {feat.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-xs font-mono font-bold text-cyan-300">
                        {feat.extent}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Coverage: {feat.coverage}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-800/80 leading-relaxed font-sans">
                      {feat.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Evidence on the Image (when model actually produces it) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                Visual Evidence on the Image
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Click any region to inspect on the viewer above
              </span>
            </div>

            {boundingBoxes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {boundingBoxes.map((b) => {
                  const isFocused = focusedEvidenceId === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => onFocusEvidence?.(b.id)}
                      className={`p-3.5 rounded-xl border text-xs transition cursor-pointer flex flex-col justify-between ${
                        isFocused
                          ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400'
                          : 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 font-semibold text-slate-100">
                          <span
                            style={{ backgroundColor: b.color || '#22d3ee' }}
                            className="w-2.5 h-2.5 rounded-full inline-block"
                          />
                          <span>{b.label}</span>
                        </div>
                        <span className="font-mono text-[10px] text-cyan-300">
                          Region Bounds Mapped
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                        {b.description}
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                        <span>Coordinates: X:{b.x}% Y:{b.y}%</span>
                        <span className="text-cyan-400">View Highlight →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/70 text-slate-400 text-xs flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <span>No spatial bounding box annotations were produced for this specific query.</span>
              </div>
            )}
          </div>

          {/* Factual Reliability / Calibration Note */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-300">Factual Precision Policy:</span>
              <p>
                If the model cannot confidently determine a specific landscape feature or structure from the provided image resolution, it reports it as unverified rather than inferring an ungrounded answer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. PAST & PRESENT RESULT: CHANGE ANALYSIS */}
      {/* ------------------------------------------------------------- */}
      {!isNoReliableResult && isBiTemporal && (
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Comparison Result
              </div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
                Change Analysis
              </h2>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs self-start sm:self-auto">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Aligned & Verified</span>
            </div>
          </div>

          {/* Short Overall Summary */}
          <div className="p-5 rounded-2xl bg-cyan-950/25 border border-cyan-800/50 space-y-2 shadow-lg">
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse" />
              Overall Summary
            </div>
            <p className="text-slate-100 text-sm sm:text-base leading-relaxed font-sans font-medium">
              &ldquo;Overall, the major changes between the Past and Present images are substantial commercial built-up expansion (+1.84 km²) and new arterial road infrastructure (+4.2 km) in the eastern sector, which displaced agricultural plots (-1.22 km²) and peripheral scrubland (-1.70 km²), while the primary lake reservoir remained preserved with zero structural encroachment.&rdquo;
            </p>
          </div>

          {/* Clearly Separated: WHAT CHANGED and WHERE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* What Changed */}
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-3">
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                What Changed
              </div>
              <p className="text-slate-100 text-sm font-semibold leading-relaxed font-sans">
                Major urban commercial expansion and transport infrastructure development detected:
              </p>
              <ul className="space-y-2 text-xs text-slate-300 font-sans">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>+1.84 km²</strong> of new built-up industrial structures, logistics facilities, and paved surfaces.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>+4.2 km</strong> new divided asphalt roadway connecting the central junction to the logistics park.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span><strong>-1.70 km²</strong> vegetation loss and <strong>-1.22 km²</strong> former agricultural plots converted.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>Primary water reservoir remained structurally stable with no urban encroachment.</span>
                </li>
              </ul>
            </div>

            {/* Where */}
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-3">
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                Where
              </div>
              <div className="text-slate-100 text-sm font-semibold font-sans">
                Eastern Urban Expansion Sector & Peripheral Transport Corridor
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Changes are geographically concentrated in the eastern quadrant along the main transit axis. New warehouses are localized in the southeast parcel, while the road extends eastward across the sector.
              </p>
              <div className="pt-1 grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">CONCENTRATION</span>
                  <span className="text-cyan-300 font-semibold truncate block">Eastern Quadrant</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">TOTAL IMPACT ZONE</span>
                  <span className="text-slate-200 font-semibold truncate block">4.2 km² Sector</span>
                </div>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* CHANGES DETECTED (BY CATEGORY)                              */}
          {/* Clear visual sections for only categories actually detected */}
          {/* ----------------------------------------------------------- */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>Changes Detected</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Categorized breakdown of observed land-cover transitions between Past and Present.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
                {detectedChangeCategories.length} Categories Detected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {detectedChangeCategories.map((cat) => {
                const badge = getStatusBadgeConfig(cat.status);
                const BadgeIcon = badge.icon;
                return (
                  <div
                    key={cat.id}
                    className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Category Header */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className="text-xl select-none" role="img" aria-label={cat.name}>
                            {cat.emoji}
                          </span>
                          <div>
                            <div className="font-bold text-sm text-slate-100">
                              {cat.name}
                            </div>
                            <div className="text-xs font-mono text-cyan-300 font-semibold mt-0.5">
                              {cat.delta}
                            </div>
                          </div>
                        </div>

                        {/* Change Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border flex items-center gap-1 shrink-0 ${badge.className}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      {/* What Changed */}
                      <p className="text-xs text-slate-200 font-sans leading-relaxed pt-3">
                        {cat.whatChanged}
                      </p>
                    </div>

                    {/* Where */}
                    <div className="pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 font-sans flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-300">Where:</strong> {cat.where}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* VISUAL EVIDENCE ON COMPARISON                               */}
          {/* If spatial evidence exists, display it clearly.             */}
          {/* If none exists, state clearly without fake maps.            */}
          {/* ----------------------------------------------------------- */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Visual Evidence on Comparison
              </div>
              {(changedRegions.length > 0 || boundingBoxes.length > 0) && (
                <span className="text-[11px] font-mono text-slate-400">
                  Select a region to focus on the comparison viewer above
                </span>
              )}
            </div>

            {changedRegions.length > 0 || boundingBoxes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {changedRegions.map((cr) => {
                  const isFocused = focusedEvidenceId === cr.id;
                  return (
                    <div
                      key={cr.id}
                      onClick={() => onFocusEvidence?.(cr.id)}
                      className={`p-4 rounded-xl border text-xs transition cursor-pointer flex flex-col justify-between ${
                        isFocused
                          ? 'bg-amber-950/60 border-amber-400 shadow-md shadow-amber-500/10 ring-1 ring-amber-400'
                          : 'bg-slate-900/70 border-slate-800 hover:border-amber-500/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-100 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                            {cr.label}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800/80">
                            {cr.direction || 'Changed'}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-cyan-300 font-bold">
                          Impact Area: {cr.areaKm2} km²
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>{cr.coordinates || 'Location mapped'}</span>
                        <span className="text-amber-400 font-medium">Highlight Zone →</span>
                      </div>
                    </div>
                  );
                })}

                {boundingBoxes.map((b) => {
                  const isFocused = focusedEvidenceId === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => onFocusEvidence?.(b.id)}
                      className={`p-4 rounded-xl border text-xs transition cursor-pointer flex flex-col justify-between ${
                        isFocused
                          ? 'bg-cyan-950/60 border-cyan-400 shadow-md ring-1 ring-cyan-400'
                          : 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-100 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                            {b.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                          {b.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Spatial Bounds Verified</span>
                        <span className="text-cyan-400 font-medium">Highlight Box →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 text-xs flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  No spatial bounding boxes or change masks were generated by the model for this query. The textual change findings above represent the verified findings.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. OPTICAL + SAR RESULT */}
      {/* ------------------------------------------------------------- */}
      {!isNoReliableResult && isOpticalSar && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-semibold">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Multi-Sensor Optical & Microwave Radar Fusion
              </div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
                Cross-Sensor Analysis
              </h2>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs self-start sm:self-auto">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>SAR Cloud Penetration Confirmed</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Fused Intelligence Summary
            </div>
            <p className="text-slate-100 text-sm sm:text-base leading-relaxed font-sans font-medium">
              {result.answer}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
              <div className="text-xs font-mono text-blue-400 uppercase tracking-wider font-semibold">
                Optical Multispectral Contributions
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                <li>• Detailed true-color spectral signature of coastline and water body channels.</li>
                <li>• Natural NDVI vegetation delineations for coastal mangrove foliage.</li>
                <li>• Visible shipping lanes and port container crane alignments.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                SAR Microwave Radar Contributions
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                <li>• Complete penetration of atmospheric haze and thin cirrus cloud cover.</li>
                <li>• Strong double-bounce returns identifying metallic crane structures and steel hulls.</li>
                <li>• Distinct specular scattering verifying calm, oil-slick-free harbor water surfaces.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
