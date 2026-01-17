# Hướng dẫn Multi-Field Embedding cho RAG

## 📋 Tổng quan

Hiện tại RAG chỉ embedding trường `description`. Hướng dẫn này giúp bạn mở rộng để embedding nhiều trường hơn (location, incident_type, root_cause, v.v.)

## 🤖 Model đang sử dụng

**SimCSE-Vietnamese-PhoBERT**: `VoVanPhuc/sup-SimCSE-VietNamese-phobert-base`
- Vector dimension: 768
- Optimized cho tiếng Việt
- **YÊU CẦU** pyvi word segmentation

## ⚠️ Quan trọng: Vietnamese Word Segmentation

**LUÔN** sử dụng pyvi để segment text tiếng Việt trước khi embedding!

```python
from pyvi.ViTokenizer import tokenize as vi_tokenize

# Ví dụ:
text = "Hóa chất rò rỉ ở khu vực sản xuất"
segmented = vi_tokenize(text)
# Kết quả: "Hóa_chất rò_rỉ ở khu_vực sản_xuất"
```

Điều này giúp model hiểu đúng từ ghép tiếng Việt như "hóa chất", "khu vực", "sản xuất".

---

## 📁 Files cần sửa

### 1. `api.py` - Endpoint tạo embedding khi resolve

**Vị trí**: Endpoint `/create-embedding/{incident_id}`

```python
@app.post("/create-embedding/{incident_id}", tags=["Webhook"])
async def create_embedding_for_incident(incident_id: str):
    try:
        with db.cursor() as cur:
            # BƯỚC 1: Thêm trường mới vào SELECT
            cur.execute("""
                SELECT id, description, location, incident_type, 
                       root_cause, corrective_actions, 
                       assigned_department_id, status
                FROM incidents WHERE id = %s::uuid
            """, (incident_id,))
            incident = cur.fetchone()

        if not incident:
            raise HTTPException(status_code=404, detail="Not found")
        
        # BƯỚC 2: Build text từ nhiều trường
        text_to_embed = build_embedding_text(
            description=incident["description"],
            location=incident.get("location"),
            incident_type=incident.get("incident_type"),
            root_cause=incident.get("root_cause"),
            corrective_actions=incident.get("corrective_actions")
        )
        
        # BƯỚC 3: Tạo embedding (pyvi segment sẽ tự động được gọi trong encode())
        embedding = embedding_service.encode(text_to_embed)
        success = db.save_embedding(incident_id, embedding)
        
        if success:
            return {"success": True, "incident_id": incident_id}
        raise HTTPException(status_code=500, detail="Failed")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def build_embedding_text(description, location=None, incident_type=None, 
                          root_cause=None, corrective_actions=None):
    """
    Combine nhiều trường thành 1 text để embedding.
    Format: "Loại: X | Vị trí: Y | Mô tả: Z | Nguyên nhân: W"
    """
    parts = []
    
    if incident_type:
        parts.append(f"Loại sự cố: {incident_type}")
    
    if location:
        parts.append(f"Vị trí: {location}")
    
    if description:
        parts.append(f"Mô tả: {description}")
    
    if root_cause:
        parts.append(f"Nguyên nhân: {root_cause}")
    
    if corrective_actions:
        parts.append(f"Biện pháp khắc phục: {corrective_actions}")
    
    return " | ".join(parts)
```

---

### 2. `batch_processor.py` - Batch tạo embedding cho incidents cũ

**Vị trí**: Method `process_all()`

```python
def process_all(self, batch_size: int = 50, max_records: Optional[int] = None) -> dict:
    # ... existing code ...
    
    for _ in tqdm(range(num_batches), desc="Processing"):
        # BƯỚC 1: Lấy thêm trường
        incidents = db.get_incidents_without_embedding(limit=batch_size)
        if not incidents:
            break

        # BƯỚC 2: Build text từ nhiều trường
        texts = [
            build_embedding_text(
                description=inc['description'],
                location=inc.get('location'),
                incident_type=inc.get('incident_type'),
                root_cause=inc.get('root_cause'),
                corrective_actions=inc.get('corrective_actions')
            )
            for inc in incidents
        ]
        
        # BƯỚC 3: Tạo embeddings (pyvi segment tự động trong encode())
        embeddings = embedding_service.encode(texts)
        
        # ... save to database ...
```

---

### 3. `database.py` - Query lấy incidents

**Vị trí**: Method `get_incidents_without_embedding()`

```python
def get_incidents_without_embedding(self, limit: int = 50) -> List[Dict]:
    """Lấy incidents chưa có embedding"""
    with self.cursor() as cur:
        cur.execute("""
            SELECT id, description, location, incident_type, 
                   root_cause, corrective_actions
            FROM incidents 
            WHERE embedding IS NULL 
              AND assigned_department_id IS NOT NULL
            ORDER BY created_at DESC
            LIMIT %s
        """, (limit,))
        return cur.fetchall()
```

---

### 4. `incident_router.py` - Query text cho search

**Vị trí**: Method `suggest_department()`

```python
def suggest_department(self, description: str, location: str = None, 
                        incident_type: str = None, priority: str = None) -> Dict:
    # BƯỚC 1: Build query text GIỐNG FORMAT embedding
    query_text = build_query_text(
        description=description,
        location=location,
        incident_type=incident_type
    )
    
    # BƯỚC 2: Tạo embedding cho query (pyvi segment tự động)
    query_embedding = embedding_service.encode(query_text, is_query=True)
    
    # ... search similar incidents ...


def build_query_text(description, location=None, incident_type=None):
    """
    Build query text PHẢI GIỐNG FORMAT với embedding text!
    Chỉ dùng các trường có thể biết được khi tạo incident mới.
    """
    parts = []
    
    if incident_type:
        parts.append(f"Loại sự cố: {incident_type}")
    
    if location:
        parts.append(f"Vị trí: {location}")
    
    if description:
        parts.append(f"Mô tả: {description}")
    
    # KHÔNG thêm root_cause, corrective_actions vì chưa có khi tạo mới
    
    return " | ".join(parts)
```

---

## ⚡ Lưu ý quan trọng

### 1. Format phải nhất quán

Query text và Embedding text **PHẢI** có format giống nhau:
- Nếu embedding là `"Loại: X | Vị trí: Y | Mô tả: Z"`
- Thì query cũng phải là `"Loại: X | Vị trí: Y | Mô tả: Z"`

### 2. pyvi Segmentation

`embedding_service.encode()` đã tự động gọi pyvi segment cho PhoBERT-based models:

```python
# Trong embedding_service.py
def encode(self, text, is_query=False):
    # Step 1: Vietnamese word segmentation (cho PhoBERT-based models)
    if self._needs_vietnamese_segmentation():
        text_to_encode = tokenize_vietnamese(text)
    else:
        text_to_encode = text
    
    # Step 2: Encode
    return self._model.encode(text_to_encode)
```

**Không cần gọi pyvi thủ công** khi dùng `embedding_service.encode()`.

### 3. Trường dùng khi tạo vs khi hoàn thành

| Thời điểm | Trường có thể dùng |
|-----------|-------------------|
| Khi tạo incident (query) | description, location, incident_type, priority |
| Khi hoàn thành (embedding) | + root_cause, corrective_actions, resolution_notes |

Query chỉ dùng trường có khi tạo mới!

### 4. Re-embed sau khi sửa code

Sau khi thay đổi format embedding, cần re-embed tất cả incidents:

```bash
# Xóa embeddings cũ
psql -U tuan -d smartfactory_db -c "UPDATE incidents SET embedding = NULL;"

# Chạy batch processor
cd E:\BGE-M3\rag_service
python -c "from batch_processor import processor; processor.process_all()"
```

---

## 📊 Ví dụ hoàn chỉnh

### Text trước khi segment:
```
Loại sự cố: equipment | Vị trí: Khu vực sản xuất A | Mô tả: Máy CNC số 5 bị rung lắc mạnh, hóa chất rò rỉ
```

### Sau khi pyvi segment:
```
Loại sự_cố: equipment | Vị_trí: Khu_vực sản_xuất A | Mô_tả: Máy CNC số 5 bị rung_lắc mạnh, hóa_chất rò_rỉ
```

---

## 🔄 Checklist khi thêm trường mới

- [ ] Thêm trường vào SELECT trong `api.py`
- [ ] Thêm trường vào SELECT trong `database.py`
- [ ] Cập nhật `build_embedding_text()` trong `api.py`
- [ ] Cập nhật `build_query_text()` trong `incident_router.py` (chỉ trường có khi tạo)
- [ ] Cập nhật `batch_processor.py`
- [ ] Re-embed tất cả incidents cũ
- [ ] Test với incidents mới

---

## 📚 Tham khảo

- **pyvi**: https://github.com/trungtv/pyvi
- **SimCSE-Vietnamese-PhoBERT**: https://huggingface.co/VoVanPhuc/sup-SimCSE-VietNamese-phobert-base
- **sentence-transformers**: https://www.sbert.net/
