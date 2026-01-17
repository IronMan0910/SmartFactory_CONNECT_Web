"""
Test ONNX Model vs PyTorch Model cho SimCSE-PhoBERT
So sánh tốc độ và kết quả
"""
import time
import numpy as np
from typing import List

# ONNX Runtime
try:
    import onnxruntime as ort
    HAS_ONNX = True
    print(f"✅ ONNX Runtime: {ort.__version__}")
except ImportError:
    HAS_ONNX = False
    print("❌ ONNX Runtime not installed. Run: pip install onnxruntime")

# Sentence Transformers (PyTorch)
try:
    from sentence_transformers import SentenceTransformer
    HAS_ST = True
    print("✅ sentence-transformers loaded")
except ImportError:
    HAS_ST = False
    print("❌ sentence-transformers not installed")

# Tokenizer
try:
    from transformers import AutoTokenizer
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False
    print("❌ transformers not installed")

# Vietnamese word segmentation
try:
    from pyvi.ViTokenizer import tokenize as vi_tokenize
    HAS_PYVI = True
    print("✅ pyvi loaded")
except ImportError:
    HAS_PYVI = False
    print("⚠️ pyvi not installed")

ONNX_MODEL_PATH = "E:\\Denso\\SmartFactory_CONNECT_Web\\BGE-M3\\rag_service\\phobert_v6_denso_onnx_compressed\\model.onnx"
TOKENIZER_PATH = "E:\\Denso\\SmartFactory_CONNECT_Web\\BGE-M3\\rag_service\\phobert_v6_denso_onnx_compressed"
MODEL_NAME = "phobert-v6-denso"  # Custom trained model


def tokenize_vietnamese(text: str) -> str:
    """Word segment Vietnamese text"""
    if not HAS_PYVI:
        return text
    return vi_tokenize(text)


def load_pytorch_model():
    """Load PyTorch model using sentence-transformers"""
    print(f"\n📦 Loading PyTorch model: {MODEL_NAME}")
    start = time.time()
    model = SentenceTransformer(MODEL_NAME)
    elapsed = time.time() - start
    print(f"   ✅ Loaded in {elapsed:.2f}s (dim={model.get_sentence_embedding_dimension()})")
    return model


def load_onnx_model():
    """Load ONNX model"""
    print(f"\n📦 Loading ONNX model: {ONNX_MODEL_PATH}")
    
    providers = ['CPUExecutionProvider']
    start = time.time()
    session = ort.InferenceSession(ONNX_MODEL_PATH, providers=providers)
    elapsed = time.time() - start
    
    # Get output dimension
    outputs = session.get_outputs()
    print(f"   ✅ Loaded in {elapsed:.2f}s (outputs: {len(outputs)})")
    
    return session


def mean_pooling(last_hidden_state: np.ndarray, attention_mask: np.ndarray) -> np.ndarray:
    """Mean pooling over sequence dimension"""
    mask_expanded = np.expand_dims(attention_mask, -1).astype(np.float32)
    sum_embeddings = np.sum(last_hidden_state * mask_expanded, axis=1)
    sum_mask = np.sum(mask_expanded, axis=1)
    return sum_embeddings / np.maximum(sum_mask, 1e-9)


def encode_pytorch(model, texts: List[str]) -> np.ndarray:
    """Encode using PyTorch model"""
    segmented = [tokenize_vietnamese(t) for t in texts]
    return model.encode(segmented, convert_to_numpy=True)


def encode_onnx(session, tokenizer, texts: List[str]) -> np.ndarray:
    """Encode using ONNX model"""
    segmented = [tokenize_vietnamese(t) for t in texts]
    
    encoded = tokenizer(
        segmented,
        padding=True,
        truncation=True,
        max_length=256,
        return_tensors="np"
    )
    
    inputs = {
        "input_ids": encoded["input_ids"].astype(np.int64),
        "attention_mask": encoded["attention_mask"].astype(np.int64),
    }
    
    input_names = [inp.name for inp in session.get_inputs()]
    if "token_type_ids" in input_names:
        inputs["token_type_ids"] = np.zeros_like(encoded["input_ids"]).astype(np.int64)
    
    outputs = session.run(None, inputs)
    embeddings = mean_pooling(outputs[0], encoded["attention_mask"])
    
    # Normalize
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    return embeddings / np.maximum(norms, 1e-9)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Calculate cosine similarity"""
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def compare_models(pytorch_model, onnx_session, tokenizer):
    """Compare PyTorch vs ONNX outputs"""
    print("\n" + "="*60)
    print("   COMPARISON: PyTorch vs ONNX")
    print("="*60)
    
    test_cases = [
        ("Máy CNC bị lỗi, không hoạt động", "Máy CNC số 1 bị lỗi, không hoạt động được"),
        ("Hóa chất rò rỉ từ bồn chứa", "Phát hiện hóa chất rò rỉ từ bồn chứa"),
        ("Máy móc hư hỏng cần sửa chữa", "Motor máy CNC phát ra tiếng kêu lớn"),
        ("Hôm nay trời đẹp quá", "Máy CNC bị lỗi"),
    ]
    
    print(f"\n{'Query':<40} {'PyTorch':<10} {'ONNX':<10} {'Diff':<10}")
    print("-"*70)
    
    for text1, text2 in test_cases:
        # PyTorch
        pt_emb = encode_pytorch(pytorch_model, [text1, text2])
        pt_sim = cosine_similarity(pt_emb[0], pt_emb[1])
        
        # ONNX
        onnx_emb = encode_onnx(onnx_session, tokenizer, [text1, text2])
        onnx_sim = cosine_similarity(onnx_emb[0], onnx_emb[1])
        
        diff = abs(pt_sim - onnx_sim) * 100
        
        query_short = text1[:38] + ".." if len(text1) > 40 else text1
        print(f"{query_short:<40} {pt_sim*100:>6.1f}%   {onnx_sim*100:>6.1f}%   {diff:>5.2f}%")


def benchmark_speed(pytorch_model, onnx_session, tokenizer, n_iterations: int = 50):
    """Benchmark speed comparison"""
    print("\n" + "="*60)
    print("   SPEED BENCHMARK")
    print("="*60)
    
    texts = [
        "Máy CNC bị lỗi, không hoạt động được",
        "Phát hiện hóa chất rò rỉ từ bồn chứa",
        "Sản phẩm có vết xước trên bề mặt",
        "Máy điều hòa không mát, nhiệt độ cao",
    ]
    
    # Warmup
    for _ in range(3):
        encode_pytorch(pytorch_model, texts)
        encode_onnx(onnx_session, tokenizer, texts)
    
    # PyTorch benchmark
    start = time.time()
    for _ in range(n_iterations):
        encode_pytorch(pytorch_model, texts)
    pt_time = time.time() - start
    
    # ONNX benchmark
    start = time.time()
    for _ in range(n_iterations):
        encode_onnx(onnx_session, tokenizer, texts)
    onnx_time = time.time() - start
    
    total = n_iterations * len(texts)
    
    print(f"\n📊 Results ({n_iterations} iterations, {len(texts)} texts each):")
    print(f"\n   PyTorch:")
    print(f"      Total: {pt_time:.2f}s")
    print(f"      Per text: {(pt_time/total)*1000:.2f}ms")
    print(f"      Throughput: {total/pt_time:.1f} texts/sec")
    
    print(f"\n   ONNX:")
    print(f"      Total: {onnx_time:.2f}s")
    print(f"      Per text: {(onnx_time/total)*1000:.2f}ms")
    print(f"      Throughput: {total/onnx_time:.1f} texts/sec")
    
    speedup = pt_time / onnx_time
    print(f"\n   🚀 ONNX Speedup: {speedup:.2f}x {'faster' if speedup > 1 else 'slower'}")


def main():
    print("\n" + "🚀"*30)
    print("   ONNX vs PyTorch MODEL TEST")
    print("🚀"*30)
    
    if not HAS_ONNX or not HAS_ST or not HAS_TRANSFORMERS:
        print("\n❌ Missing dependencies!")
        return
    
    # Load models
    pytorch_model = load_pytorch_model()
    onnx_session = load_onnx_model()
    tokenizer = AutoTokenizer.from_pretrained(TOKENIZER_PATH, local_files_only=True)
    
    # Compare outputs
    compare_models(pytorch_model, onnx_session, tokenizer)
    
    # Benchmark speed
    benchmark_speed(pytorch_model, onnx_session, tokenizer)
    
    print("\n" + "✅"*30)
    print("   TEST COMPLETED!")
    print("✅"*30 + "\n")


if __name__ == "__main__":
    main()
