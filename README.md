docker run --runtime nvidia --gpus all --env "TRANSFORMERS_OFFLINE=1" --env "HF_DATASET_OFFLINE=1" -p 3000:3000 -p 8000:8000 --ipc=host --name self-contained-container self-contained-vllm-webide
