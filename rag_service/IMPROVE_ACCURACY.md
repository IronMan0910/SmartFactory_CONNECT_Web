# 🚀 Hướng dẫn Cải thiện Accuracy cho RAG System

## 📊 Tình trạng hiện tại

API đang sử dụng model cũ vì chưa restart. Cần thực hiện các bước sau:

## 🔧 Bước 1: Restart API với Model mới

```bash
# Tắt API cũ (Ctrl+C) rồi chạy lại
cd E:\Denso\SmartFactory_CONNECT_Web\BGE-M3
.\.venv\Scripts\activate
cd rag_service
python main.py
```

API sẽ hiển thị:
- `Model: phobert-v6-denso` (thay vì SimCSE-PhoBERT)

## 🔧 Bước 2: Re-embed toàn bộ DB với model mới

```bash
# Xoá embeddings cũ
python clear_embeddings.py --yes

# Tạo embeddings mới
curl -X POST http://localhost:8001/embeddings/batch
```

Hoặc sử dụng Python:
```python
import requests
# Xoá embeddings cũ
requests.post('http://localhost:8001/embeddings/clear')
# Tạo mới
requests.post('http://localhost:8001/embeddings/batch')
```

## 🔧 Bước 3: Chạy test

```bash
python test_api_realdb.py
```

## 📈 Cách Cải thiện Accuracy

### 1. **Thêm dữ liệu training đa dạng hơn**
- Mỗi department cần >= 200 incidents mẫu
- Mô tả đa dạng về cách diễn đạt
- Bao gồm cả tiếng Việt có dấu và không dấu

### 2. **Fine-tune model (nếu cần)**
- Export dữ liệu training từ DB
- Fine-tune PhoBERT với contrastive learning
- Convert sang ONNX và cập nhật

### 3. **Điều chỉnh hyperparameters**
Trong `.env`:
```env
# Giảm MIN_SIMILARITY để recall cao hơn
MIN_SIMILARITY=0.10

# Tăng DEFAULT_LIMIT để có nhiều candidates hơn
DEFAULT_LIMIT=10

# Điều chỉnh AUTO_ASSIGN_THRESHOLD
AUTO_ASSIGN_THRESHOLD=0.85
```

### 4. **Sử dụng Reranker (optional)**
```env
USE_RERANKER=true
RERANKER_THRESHOLD=0.01
```

### 5. **Multi-field matching**
Khi gọi API, cung cấp thêm context:
```json
{
    "description": "Máy CNC bị lỗi",
    "location": "Xưởng A",
    "incident_type": "equipment",
    "priority": "high"
}
```

## 📊 Target Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Accuracy | ~60% | >85% |
| Avg Response | ~2000ms | <500ms |
| Confidence | ~0.4 | >0.7 |

## 🔍 Debug Tips

1. **Kiểm tra model đang dùng:**
   ```bash
   curl http://localhost:8001/health
   ```

2. **Kiểm tra embedding stats:**
   ```bash
   curl http://localhost:8001/embeddings/stats
   ```

3. **Test manual suggestion:**
   ```bash
   curl -X POST http://localhost:8001/suggest \
     -H "Content-Type: application/json" \
     -d '{"description": "Máy CNC bị lỗi"}'
   ```
