"""
SatQuery AI - FastAPI Remote Sensing Backend Application
Problem Statement 26167 (SIH):
An Interactive Vision-Language Assistant for Multimodal Remote Sensing Image Analysis through Text Queries.
"""
import time
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .config import API_TITLE, API_VERSION, API_DESCRIPTION, DEVICE
from .schemas import (
    ValidateImageRequest,
    GeoTIFFMetadata,
    ClassifyTaskRequest,
    ClassifyTaskResponse,
    AnalyzeRequest,
    AnalyzeResponse,
    ChangeAnalysisRequest,
    OpticalSARAnalysisRequest,
    ModelInfoSchema,
    HealthResponse
)
from .geospatial.validator import GeoTIFFValidator
from .registry.tools import ToolRegistry
from .orchestrator.agent import SatQueryAgent
from .storage.history import history_store

# Initialize FastAPI App
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware to allow communication from UI / proxy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Agent Orchestrator
agent = SatQueryAgent()

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint reporting runtime accelerator, active model count, and system status.
    """
    models = ToolRegistry.get_all_tools()
    return HealthResponse(
        status="healthy",
        timestamp=time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        environment="SatQuery AI Remote Sensing Backend",
        accelerator=DEVICE,
        architecture="FastAPI + PyTorch/ONNX Modular Engine",
        activeModelsCount=len(models),
        version=API_VERSION
    )

@app.post("/api/validate-image", response_model=GeoTIFFMetadata)
async def validate_image(request: ValidateImageRequest):
    """
    Validates GeoTIFF / satellite raster inputs, inspecting CRS, geotransform,
    spatial resolution, bands, and modality.
    """
    is_valid_format, format_msg = GeoTIFFValidator.validate_file_format(request.filename)
    if not is_valid_format:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=format_msg)

    meta = GeoTIFFValidator.extract_metadata(
        filename=request.filename,
        file_size_bytes=request.fileSizeBytes or 0,
        role=request.role or "single",
        mode=request.mode or "single"
    )
    return meta

@app.post("/api/classify-task", response_model=ClassifyTaskResponse)
async def classify_task(request: ClassifyTaskRequest):
    """
    Agentic task-classification layer. Inspects natural language query,
    image count, modalities, and mode to classify into VQA, Captioning,
    Grounding, Change Analysis, or Optical-SAR Fusion.
    """
    task_type = agent.classify_task(
        query=request.query,
        mode=request.mode,
        image_count=request.imageCount,
        modalities=request.modalities
    )
    tool_info = ToolRegistry.select_tool_for_task(task_type, request.mode)

    return ClassifyTaskResponse(
        taskType=task_type,
        primaryCapability=tool_info["category"],
        recommendedModel=tool_info["name"],
        confidence=96.4,
        reasoning=f"Query semantics and mode '{request.mode}' aligned with specialist {tool_info['name']}."
    )

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Central analysis endpoint executing the 8-stage agentic workflow.
    """
    try:
        response = agent.execute_pipeline(
            query=request.query,
            mode=request.mode,
            images_dict=request.images
        )

        # Record in history store
        history_store.add_entry({
            "id": f"hist-{int(time.time() * 1000)}",
            "query": response.query,
            "analysisType": response.taskType.replace("-", " ").upper(),
            "date": time.strftime("%Y-%m-%d %H:%M"),
            "input": response.inputInformation,
            "status": "Completed",
            "confidence": response.confidence,
            "selectedModel": response.selectedModel,
            "answer": response.answer,
            "evidence": response.evidence
        })

        return response
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.post("/api/change-analysis", response_model=AnalyzeResponse)
async def change_analysis(request: ChangeAnalysisRequest):
    """
    Dedicated endpoint for Bi-Temporal Change Analysis between two timestamps.
    """
    images_dict = {
        "before": request.beforeImage,
        "after": request.afterImage
    }
    return agent.execute_pipeline(
        query=request.query,
        mode="bi-temporal",
        images_dict=images_dict
    )

@app.post("/api/optical-sar-analysis", response_model=AnalyzeResponse)
async def optical_sar_analysis(request: OpticalSARAnalysisRequest):
    """
    Dedicated endpoint for cross-modal Optical + SAR Radar Fusion Analysis.
    """
    images_dict = {
        "optical": request.opticalImage,
        "sar": request.sarImage
    }
    return agent.execute_pipeline(
        query=request.query,
        mode="optical-sar",
        images_dict=images_dict
    )

@app.get("/api/models", response_model=List[ModelInfoSchema])
async def get_models():
    """
    Returns the technical registry of specialist remote-sensing models.
    """
    return ToolRegistry.get_all_tools()

@app.get("/api/history", response_model=List[Dict[str, Any]])
async def get_history():
    """
    Returns historical mission intelligence records.
    """
    return history_store.get_all()
