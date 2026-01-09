FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy shared lock file
COPY uv.lock pyproject.toml /app/

# Install dependencies
RUN uv sync --frozen --no-install-project --no-dev

# Copy application code
COPY app /app/app

# Place executables in the environment at the front of the path
ENV PATH="/app/.venv/bin:$PATH"

# Reset the entrypoint, don't invoke `uv`
ENTRYPOINT []

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
