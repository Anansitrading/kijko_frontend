# Kijko API — Production Dockerfile
# Multi-stage build for minimal image size

FROM python:3.12-slim AS base

# Set environment
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app

USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
    CMD curl -f http://localhost:8000/health || exit 1

# Run with uvicorn
CMD ["uvicorn", "server.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
