"""
SatQuery AI - Specialist Model and Tool Registry
Maintains technical capabilities, supported modalities, parameter counts,
and deployment availability for all remote-sensing neural architectures.
"""
from typing import Dict, List, Any, Optional
from ..schemas import ModelInfoSchema

TOOL_REGISTRY: Dict[str, Dict[str, Any]] = {
    "rs-vqa-transformer": {
        "id": "rs-vqa-transformer",
        "name": "RS-VQA Dual-Encoder",
        "category": "Visual Question Answering",
        "architecture": "Cross-Attention Swin-Transformer + DeBERTa-v3 with BigEarthNet Prior",
        "modalities": ["Optical RGB", "Multispectral (12-Band)"],
        "supportedInputCount": 1,
        "supportedFormats": ["GeoTIFF", "TIFF", "PNG", "JPEG"],
        "gsdRange": "0.3m – 30.0m",
        "parameters": "380M",
        "inputResolution": "512 × 512 / 1024 × 1024 px",
        "description": "Specialist geospatial VQA model trained on remote-sensing benchmark datasets (RSVQA, EarthVQA). Answers queries regarding infrastructure counts, land use, and spectral characteristics.",
        "status": "Connected",
        "supportedTasks": ["vqa", "land-cover-classification", "feature-verification"],
        "parametersConfig": {
            "temperature": 0.2,
            "maxTokens": 256,
            "confidenceThreshold": 0.65,
        }
    },
    "rs-captioning-engine": {
        "id": "rs-captioning-engine",
        "name": "GeoCaption-Net",
        "category": "Vision-Language Generation",
        "architecture": "CLIP-ViT-Large/14 + Autoregressive Remote Sensing Decoder",
        "modalities": ["Optical RGB", "NIR Multispectral"],
        "supportedInputCount": 1,
        "supportedFormats": ["GeoTIFF", "TIFF", "PNG", "JPEG"],
        "gsdRange": "0.5m – 15.0m",
        "parameters": "450M",
        "inputResolution": "768 × 768 px",
        "description": "Dense scene-level captioning engine generating comprehensive geographic descriptions including land-cover proportions, spatial topography, and visible anthropic structures.",
        "status": "Available",
        "supportedTasks": ["scene-captioning", "synoptic-description", "land-cover-inventory"],
        "parametersConfig": {
            "beamSize": 4,
            "lengthPenalty": 1.2,
            "topP": 0.9,
        }
    },
    "spatial-grounding-det": {
        "id": "spatial-grounding-det",
        "name": "SatGround-DETR",
        "category": "Spatial Localization",
        "architecture": "Deformable DETR with Linguistic Feature Grounding",
        "modalities": ["Optical RGB", "False Color NIR"],
        "supportedInputCount": 1,
        "supportedFormats": ["GeoTIFF", "TIFF", "PNG", "JPEG"],
        "gsdRange": "0.1m – 5.0m",
        "parameters": "285M",
        "inputResolution": "1024 × 1024 px",
        "description": "Text-guided bounding box and polygon detector mapping natural language phrases directly to geographic bounding coordinates and CRS spatial features.",
        "status": "Connected",
        "supportedTasks": ["text-guided-grounding", "target-detection", "spatial-anchoring"],
        "parametersConfig": {
            "iouThreshold": 0.45,
            "nmsThreshold": 0.5,
            "scoreThreshold": 0.70,
        }
    },
    "bitemporal-diff-net": {
        "id": "bitemporal-diff-net",
        "name": "ChangeFormer-V2",
        "category": "Bi-Temporal Difference Modeling",
        "architecture": "Siamese Vision Transformer with Temporal Difference Attention",
        "modalities": ["Bi-Temporal Optical", "Bi-Temporal Multispectral"],
        "supportedInputCount": 2,
        "supportedFormats": ["GeoTIFF", "TIFF", "PNG", "JPEG"],
        "gsdRange": "0.5m – 30.0m",
        "parameters": "512M",
        "inputResolution": "Dual 512 × 512 px / 1024 × 1024 px",
        "description": "Detects land-cover transitions, urban sprawl, vegetation loss, and water body shrinkage across dual timestamps with spatial difference masks and change quantification.",
        "status": "Demo",
        "supportedTasks": ["change-analysis", "change-based-vqa", "urban-sprawl-monitoring"],
        "parametersConfig": {
            "changeSensitivity": 0.75,
            "minRegionSizePx": 16,
            "morphologicalClean": True,
        }
    },
    "optical-sar-fusion-net": {
        "id": "optical-sar-fusion-net",
        "name": "CrossSens-Fusion",
        "category": "Cross-Modal Fusion",
        "architecture": "Dual-Stream Cross-Attention (ResNet-101 + U-Net SAR Backscatter Encoder)",
        "modalities": ["Optical RGB", "SAR (Sentinel-1 C-Band VV/VH)"],
        "supportedInputCount": 2,
        "supportedFormats": ["GeoTIFF", "TIFF", "PNG", "JPEG"],
        "gsdRange": "10.0m – 20.0m",
        "parameters": "620M",
        "inputResolution": "Paired 512 × 512 px",
        "description": "Jointly processes optical reflectance and SAR dielectric/roughness backscatter to penetrate cloud cover and distinguish high-dielectric water bodies from double-bounce urban structures.",
        "status": "Connected",
        "supportedTasks": ["optical-sar-analysis", "cloud-penetrating-mapping", "flood-extent-mapping"],
        "parametersConfig": {
            "sarWeight": 0.5,
            "opticalWeight": 0.5,
            "coherenceFilter": True,
        }
    },
    "rs-foundational-vlm": {
        "id": "rs-foundational-vlm",
        "name": "EarthVLM-7B",
        "category": "Foundational Multimodal Model",
        "architecture": "Autoregressive 7B Remote Sensing Foundation Model (LoRA Adapted)",
        "modalities": ["Optical", "SAR", "Multispectral", "Digital Elevation Model"],
        "supportedInputCount": 2,
        "supportedFormats": ["GeoTIFF", "TIFF", "PNG", "JPEG"],
        "gsdRange": "0.1m – 60.0m",
        "parameters": "7.2B",
        "inputResolution": "Multi-scale Tiled 1024 × 1024 px",
        "description": "End-to-end vision-language foundation model designed for zero-shot conversational remote sensing analytics and complex multi-step reasoning.",
        "status": "Planned",
        "supportedTasks": ["vqa", "scene-captioning", "change-analysis", "optical-sar-analysis"],
        "parametersConfig": {
            "quantization": "4-bit",
            "contextWindow": 4096,
        }
    }
}

class ToolRegistry:
    @staticmethod
    def get_all_tools() -> List[ModelInfoSchema]:
        return [
            ModelInfoSchema(
                id=t["id"],
                name=t["name"],
                category=t["category"],
                architecture=t["architecture"],
                modalities=t["modalities"],
                gsdRange=t["gsdRange"],
                parameters=t["parameters"],
                inputResolution=t["inputResolution"],
                description=t["description"],
                status=t["status"],
                supportedTasks=t["supportedTasks"],
            )
            for t in TOOL_REGISTRY.values()
        ]

    @staticmethod
    def get_tool(tool_id: str) -> Optional[Dict[str, Any]]:
        return TOOL_REGISTRY.get(tool_id)

    @staticmethod
    def select_tool_for_task(task_type: str, mode: str) -> Dict[str, Any]:
        if mode == "bi-temporal" or task_type in ["change-analysis", "change-based-vqa"]:
            return TOOL_REGISTRY["bitemporal-diff-net"]
        elif mode == "optical-sar" or task_type == "optical-sar-analysis":
            return TOOL_REGISTRY["optical-sar-fusion-net"]
        elif task_type == "text-guided-grounding":
            return TOOL_REGISTRY["spatial-grounding-det"]
        elif task_type == "scene-captioning":
            return TOOL_REGISTRY["rs-captioning-engine"]
        else:
            return TOOL_REGISTRY["rs-vqa-transformer"]
