FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN python -m pip install --upgrade pip

COPY packages/core/pyproject.toml packages/core/pyproject.toml
COPY packages/core/src packages/core/src
COPY apps/api/pyproject.toml apps/api/pyproject.toml
COPY apps/api/src apps/api/src

RUN python -m pip install -e packages/core -e apps/api

EXPOSE 8010

CMD ["python", "-m", "uvicorn", "formulia_api.main:app", "--host", "0.0.0.0", "--port", "8010"]
