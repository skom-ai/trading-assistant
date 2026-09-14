# =====================================================================
# File: Dockerfile
# Description: Container image for the Valtide FastAPI agent /
#              deterministic-engine service (Process + System/Data layers).
#              Internal-only; served behind the NestJS BFF.
# =====================================================================
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /srv

# Install runtime deps first (layer caching) — copy project metadata only.
COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install .

# Copy the application source.
COPY app ./app

# Non-root runtime user.
RUN useradd --create-home --uid 10001 valtide && chown -R valtide:valtide /srv
USER valtide

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')" || exit 1

# Uvicorn serves the app factory result (module-level `app`).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
