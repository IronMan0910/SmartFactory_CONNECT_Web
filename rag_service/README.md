# RAG Incident Router Service

AI-powered incident routing system using RAG (Retrieval-Augmented Generation) to automatically suggest departments for handling incidents.

## Features

- **Vietnamese Support**: Uses pyvi for word segmentation (`"hóa chất"` → `"hóa_chất"`)
- **PhoBERT-v6-Denso Model**: Custom trained model with better category separation (12.67% vs 9.4%)
- **ONNX Acceleration**: 2x faster inference with ONNX Runtime
- **Multi-field Matching**: Combines description, location, type, priority
- **Auto-assign**: Automatically assigns department when confidence >= 90%

## Model Comparison

| Model | Separation | Speed | Recommended |
|-------|-----------|-------|-------------|
| PhoBERT-v6-Denso (compressed) | 12.67% | 139 texts/s | ✅ Yes |
| SimCSE-PhoBERT | 9.40% | 133 texts/s | No |

## Requirements

- Python 3.10+
- PostgreSQL 15+ with pgvector extension
- 4GB RAM (for embedding model)

## Quick Start

### 1. Install PostgreSQL with pgvector

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Setup Python Environment

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartfactory_db
DB_USER=your_user
DB_PASSWORD=your_password

# Model (PHOBERT_V6_DENSO recommended - custom trained)
MODEL_TYPE=PHOBERT_V6_DENSO

# Search Settings
MIN_SIMILARITY=0.15
AUTO_ASSIGN_THRESHOLD=0.90
```

### 4. Run Service

```bash
python main.py
```

Service will start at `http://localhost:8001`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/suggest` | POST | Get department suggestion for incident |
| `/health` | GET | Health check |
| `/stats` | GET | Embedding statistics |
| `/process-batch` | POST | Create embeddings for existing incidents |
| `/create-embedding/{id}` | POST | Create embedding for single incident |

### Example: Suggest Department

```bash
curl -X POST http://localhost:8001/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Máy CNC bị rung lắc mạnh",
    "location": "Khu vực gia công",
    "incident_type": "equipment",
    "priority": "high"
  }'
```

Response:
```json
{
  "success": true,
  "suggestion": {
    "department_id": "xxx",
    "department_name": "Phòng thiết bị",
    "confidence": 0.92,
    "auto_assign": true
  }
}
```

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Mobile/Web     │────▶│  Backend         │────▶│  RAG Service    │
│  (Incident)     │     │  (Node.js:3001)  │     │  (Python:8001)  │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  PostgreSQL     │
                                                 │  + pgvector     │
                                                 └─────────────────┘
```

## Performance

| Metric | Value |
|--------|-------|
| Suggestion latency | ~200ms |
| Embedding creation | ~50ms |
| Accuracy (Vietnamese) | 92-100% |

## Files

| File | Description |
|------|-------------|
| `main.py` | Entry point |
| `api.py` | FastAPI endpoints |
| `config.py` | Configuration |
| `database.py` | PostgreSQL + pgvector |
| `embedding_service.py` | PhoBERT-v6-Denso embeddings + pyvi |
| `incident_router.py` | RAG logic |
| `batch_processor.py` | Batch embedding creation |
| `phobert_v6_denso_onnx_compressed/` | Custom trained model (ONNX) |

## License

MIT
