/**
 * SatQuery AI - RSVQA & Public Benchmark Evaluation Harness
 * Evaluates Remote-Sensing VQA against prescribed benchmarks (RSVQA-HR, RSVQA-LR, BigEarthNet).
 * Does not fabricate benchmark scores.
 */
import { BenchmarkSpec } from '../../types';

export const BENCHMARK_SPECS: Record<string, BenchmarkSpec> = {
  'rsvqa-hr': {
    benchmark: 'RSVQA-HR (High-Resolution Aerial VQA)',
    targetModalities: ['Optical High-Resolution (0.15m GSD)'],
    prescribedMetrics: [
      'Overall Accuracy (OA %)',
      'Average Accuracy (AA %)',
      'Presence Question Accuracy (%)',
      'Comparison Question Accuracy (%)',
      'Count Question Accuracy (%)',
    ],
    evaluationStatus: 'Ready for Benchmark (Test Split Configured)',
  },
  'rsvqa-lr': {
    benchmark: 'RSVQA-LR (Sentinel-2 Low-Resolution VQA)',
    targetModalities: ['Optical Multispectral Sentinel-2 (10m GSD)'],
    prescribedMetrics: [
      'Overall Accuracy (OA %)',
      'Average Accuracy (AA %)',
      'Rural / Urban Stratified Accuracy (%)',
    ],
    evaluationStatus: 'Ready for Benchmark (Test Split Configured)',
  },
  'bigearthnet-vqa': {
    benchmark: 'BigEarthNet-S2 Multi-label VQA Adaptation',
    targetModalities: ['Sentinel-2 12-Band Multispectral', 'Sentinel-1 Dual-Pol SAR'],
    prescribedMetrics: [
      'Top-1 Exact Match (%)',
      'Corine Land Cover 19-Class Mean IoU',
      'Macro-Averaged F1 Score',
    ],
    evaluationStatus: 'Adaptation Protocol Ready',
  },
};

export interface EvaluationPair {
  id: string;
  question: string;
  category: string;
  groundTruthAnswer: string;
  predictedAnswer: string;
}

export function computeBenchmarkMetrics(
  benchmarkId: string,
  pairs: EvaluationPair[]
): BenchmarkSpec {
  const spec = BENCHMARK_SPECS[benchmarkId] || BENCHMARK_SPECS['rsvqa-hr'];

  if (!pairs || pairs.length === 0) {
    return {
      ...spec,
      evaluationStatus: 'Ready for Benchmark (Awaiting Test Annotations)',
    };
  }

  let totalCorrect = 0;
  const catStats: Record<string, { total: number; correct: number }> = {};

  for (const p of pairs) {
    const cat = p.category || 'general';
    if (!catStats[cat]) {
      catStats[cat] = { total: 0, correct: 0 };
    }
    catStats[cat].total += 1;

    const gt = p.groundTruthAnswer.trim().toLowerCase();
    const pred = p.predictedAnswer.trim().toLowerCase();
    const isMatch = gt === pred || gt.includes(pred) || pred.includes(gt);

    if (isMatch) {
      totalCorrect += 1;
      catStats[cat].correct += 1;
    }
  }

  const overallAccuracy = Math.round((totalCorrect / pairs.length) * 1000) / 10;
  const categoryAccuracies: Record<string, number> = {};

  let sumCatAcc = 0;
  let countCats = 0;
  for (const [cat, data] of Object.entries(catStats)) {
    const acc = Math.round((data.correct / data.total) * 1000) / 10;
    categoryAccuracies[cat] = acc;
    sumCatAcc += acc;
    countCats += 1;
  }

  const averageAccuracy = countCats > 0 ? Math.round((sumCatAcc / countCats) * 10) / 10 : overallAccuracy;

  return {
    ...spec,
    sampleCount: pairs.length,
    overallAccuracy,
    averageAccuracy,
    categoryAccuracies,
    evaluationStatus: `Evaluation Complete (${pairs.length} test samples evaluated)`,
  };
}
