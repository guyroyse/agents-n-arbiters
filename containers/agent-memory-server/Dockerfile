FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y git build-essential

# Remove cached packages to reduce image size
RUN rm -rf /var/lib/apt/lists/*

# Install uv for faster Python package management
RUN pip install uv

# Clone and setup Agent Memory Server
RUN git clone https://github.com/redis/agent-memory-server.git .
RUN uv sync

# Set universal app defaults
ENV LONG_TERM_MEMORY=false
ENV PORT=8000

# Expose port 8000 (AMS default)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/v1/health || exit 1

# Run Agent Memory Server
CMD ["uv", "run", "agent-memory", "api", "--host", "0.0.0.0", "--port", "8000"]
