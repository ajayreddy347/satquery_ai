"""
SatQuery AI - Remote-Sensing Vision-Language Model (RS-VLM) Base Interface
Modular, pluggable base class for open-source remote-sensing foundation models
(e.g., RemoteCLIP, GeoChat, EarthDial, RSVQA architectures).
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple

class BaseRemoteSensingVLM(ABC):
    """
    Abstract interface for Remote-Sensing Vision-Language Models.
    Enables swapping underlying neural checkpoints without modifying API or frontend.
    """
    def __init__(self, model_id: str, name: str, architecture: str):
        self.model_id = model_id
        self.name = name
        self.architecture = architecture
        self._is_loaded: bool = False
        self._checkpoint_path: Optional[str] = None
        self._device: str = "cpu"
        self._status: str = "Available"  # "Integrated" | "Available" | "Training Required" | "Demo" | "Planned" | "Error"

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    @property
    def status(self) -> str:
        return self._status

    @abstractmethod
    def load_checkpoint(self, checkpoint_path: str, device: str = "cpu") -> bool:
        """
        Loads model weights from local path or HuggingFace checkpoint.
        Returns True on success, False if file missing or corrupt.
        """
        pass

    @abstractmethod
    def predict_vqa(
        self,
        query: str,
        preprocessed_image: Any,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes single-image Visual Question Answering inference.
        Returns structured dictionary:
        {
            "answer": str,
            "raw_logits": Optional[Any],
            "spatial_features": Optional[Any],
            "detected_concepts": List[str],
            "spatial_evidence_available": bool,
            "spatial_boxes": Optional[List[Dict[str, Any]]]
        }
        """
        pass

    @abstractmethod
    def extract_evidence(
        self,
        query: str,
        prediction: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[str], bool, Optional[List[Dict[str, Any]]]]:
        """
        Extracts spectral, spatial, and semantic evidence citations.
        Returns:
            (textual_evidence_list, spatial_evidence_available, bounding_boxes_or_none)
        Never fabricates bounding boxes if spatial grounding is not supported.
        """
        pass

    @abstractmethod
    def estimate_confidence(
        self,
        prediction: Dict[str, Any],
        query: str
    ) -> Optional[float]:
        """
        Computes calibrated prediction confidence percentage (0.0 - 100.0).
        If reliable confidence is unavailable, returns None (displayed as "Confidence unavailable").
        """
        pass
