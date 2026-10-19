FROM python:3.12-slim

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies & OpenJDK for PySpark support
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    openjdk-21-jre \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"

WORKDIR /app

# Copy dependency requirements from root build context and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code into /app/app/
COPY backend/app/ ./app/

# Copy required runtime data, pre-trained model artifacts, experiments, and reports
COPY dataset/ ./dataset/
COPY artifacts/ ./artifacts/
COPY experiments/ ./experiments/
COPY processed_data/ ./processed_data/
COPY reports/ ./reports/

EXPOSE 8000

# Start FastAPI application using dynamic port for Render with fallback to 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
