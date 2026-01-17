# RAG Service Model Setup

## Tải Model

Model PhoBERT ONNX quá lớn để lưu trên GitHub (513MB). Vui lòng tải từ một trong các nguồn sau:

### Option 1: Google Drive
```bash
# Download từ Google Drive
# Link: [TBD - Upload model lên Drive và cung cấp link]
```

### Option 2: Tự build từ PyTorch
```bash
cd rag_service
python -c "
from transformers import AutoModel, AutoTokenizer
import torch
import onnx
from optimum.onnxruntime import ORTModelForFeatureExtraction

# Load PhoBERT
model = AutoModel.from_pretrained('vinai/phobert-base-v2')
tokenizer = AutoTokenizer.from_pretrained('vinai/phobert-base-v2')

# Export to ONNX
ort_model = ORTModelForFeatureExtraction.from_pretrained(
    'vinai/phobert-base-v2',
    export=True
)

# Save
ort_model.save_pretrained('phobert_v6_denso_onnx_compressed')
tokenizer.save_pretrained('phobert_v6_denso_onnx_compressed')
"
```

### Option 3: Sử dụng Model Nhỏ Hơn (Khuyến nghị)
```python
# Sử dụng sentence-transformers model đã được tối ưu
# Model này đã được RAG service sử dụng mặc định
# sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
# Kích thước: ~120MB
```

## Cấu trúc thư mục sau khi setup

```
rag_service/
└── phobert_v6_denso_onnx_compressed/
    ├── model.onnx          # 513MB - Main model file
    ├── config.json         # Model config
    ├── vocab.txt          # Vocabulary
    ├── bpe.codes          # BPE codes for tokenization
    ├── tokenizer_config.json
    ├── special_tokens_map.json
    └── added_tokens.json
```

## Lưu ý

- File này được ignore bởi `.gitignore`
- RAG service sẽ tự động download model khi khởi động lần đầu nếu không tìm thấy
- Model mặc định: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
