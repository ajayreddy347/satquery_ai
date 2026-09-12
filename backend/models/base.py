"""
SatQuery AI - Abstract Base Remote Sensing Model
Defines uniform contract for all specialized neural architectures:
predict(), extract_evidence(), is_loaded(), and capability reporting.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseRemoteSensingModel(ABC):
    def __init__(self, model_id: str, name: str):
        self.model_id = model_id
        self.name = name
        self._is_loaded = False
        self._weights_path: Optional[str] = None

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    @abstractmethod
    def load_weights(self, weights_path: Optional[str] = None) -> bool:
        """Loads neural weights into memory or device (GPU/CPU)."""
        pass

    @abstractmethod
    def predict(
        self,
        query: str,
        inputs: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes inference over raster inputs and query.
        Returns dictionary containing:
        - answer: str
        - confidence: float
        - evidence: List[str]
        - visual_outputs: Optional[Dict]
        - is_simulation: bool
        """
        pass

    @abstractmethod
    def extract_evidence(self, prediction: Dict[str, Any]) -> List[str]:
        """Extracts structured spectral and spatial evidence citations."""
        pass
