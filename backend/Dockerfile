# SatQuery AI - GPU-Ready Production Dockerfile
# Based on NVIDIA CUDA PyTorch container for high-throughput remote sensing inference
FROM nvidia/cuda:12.1.1-runtime-ubuntu22.04

# Environment Configuration
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8000

# Install System Geospatial Dependencies (GDAL, PROJ, GEOS)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    python3-pip \
    python3.10-dev \
    libgdal-dev \
    gdal-bin \
    libgeos-dev \
    libproj-dev \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set Working Directory
WORKDIR /app

# Copy Requirements and Install Python Dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -U pip setuptools wheel
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy Backend Architecture Code
COPY . /app/backend

# Expose Internal Microservice Port
EXPOSE 8000

# Launch Uvicorn Server with 4 Workers
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
