FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/home/app/.cache/huggingface

# The HF_HOME directory must exist and be owned by `app` before the named volume
# is mounted over it — Docker seeds a new volume from the image path, so this is
# what stops the cache mount from landing as root-owned and unwritable.
RUN useradd --create-home --uid 1000 app \
    && mkdir -p /home/app/.cache/huggingface \
    && chown -R app:app /home/app

WORKDIR /app

COPY requirements.txt .

# torch must come from PyTorch's CPU index. The default PyPI wheel is the CUDA
# build, which drags in ~7GB of NVIDIA libraries that are useless without a GPU.
# Installing it first means the requirements.txt pass sees it already satisfied.
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch \
    && pip install -r requirements.txt

COPY app ./app

USER app
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]
