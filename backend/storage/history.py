"""
SatQuery AI - Historical Analysis Storage
Stores completed intelligence analyses for provenance audits and export.
"""
from typing import List, Dict, Any
import time

class AnalysisHistoryStore:
    def __init__(self):
        # Initialize with baseline certified missions
        self._history: List[Dict[str, Any]] = [
            {
                "id": "hist-101",
                "query": "Describe the land-cover and major objects visible in this image.",
                "analysisType": "SCENE CAPTIONING",
                "date": "2026-09-07 18:42",
                "input": "mumbai_port_sentinel2.tif",
                "status": "Completed",
                "confidence": 94.2,
                "selectedModel": "GeoCaption-Net",
                "answer": "A high-resolution synoptic overview revealing an engineered coastal metropolitan zone with container terminals and shipping berths.",
                "evidence": ["Identified 6 industrial berths along quayside docking structures."]
            },
            {
                "id": "hist-102",
                "query": "Highlight the water body referred to in the query.",
                "analysisType": "TEXT GUIDED GROUNDING",
                "date": "2026-09-07 17:15",
                "input": "powai_lake_orthomosaic.tif",
                "status": "Completed",
                "confidence": 97.4,
                "selectedModel": "SatGround-DETR",
                "answer": "Primary inland reservoir localized between 18.9740° N and 72.8270° E with sharp bank delimitation.",
                "evidence": ["Spatial grounding attention score peaked at 0.974 corresponding to token 'water body'."]
            },
            {
                "id": "hist-103",
                "query": "What changed between these two dates, and where did the change occur?",
                "analysisType": "CHANGE ANALYSIS",
                "date": "2026-09-07 14:30",
                "input": "mumbai_t1_baseline.tif → mumbai_t2_monitoring.tif",
                "status": "Completed",
                "confidence": 95.8,
                "selectedModel": "ChangeFormer-V2",
                "answer": "Significant urban expansion detected: +2.85 km² (+32.4%) new commercial built-up infrastructure replacing scrubland.",
                "evidence": ["Bi-temporal difference tensor confirms +2.85 km² of newly constructed built-up surfaces."]
            }
        ]

    def get_all(self) -> List[Dict[str, Any]]:
        return self._history

    def add_entry(self, entry: Dict[str, Any]) -> None:
        self._history.insert(0, entry)

history_store = AnalysisHistoryStore()
