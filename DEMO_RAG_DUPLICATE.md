# 📋 DEMO RAG DUPLICATE DETECTION

## 🎯 Mục đích
Demo tính năng RAG (Retrieval-Augmented Generation) để phát hiện trùng lặp ý tưởng/ý kiến với workflow history đầy đủ.

---

## 📊 Demo Data đã có sẵn

### Scenario 1: Chất lượng bữa ăn ca 3 ✅ (Historical - Published)
- **ID**: `0ec11bf7-1843-49a2-b834-fa3d2839b876`
- **Tiêu đề**: "Cải thiện chất lượng bữa ăn ca 3"
- **Loại**: Ý kiến (Opinion) - Hòm trắng
- **Trạng thái**: Đã công bố
- **Workflow**: submitted → supervisor_review → manager_review → department_responded → published

**📜 Lịch sử phản hồi:**
1. Supervisor: "Đã ghi nhận ý kiến. Sẽ chuyển lên phòng hành chính để xem xét."
2. Manager: "Đã họp với đơn vị cung cấp suất ăn. Họ cam kết cải thiện từ tuần tới."
3. Manager: "Kết quả triển khai: 1) Thêm 2 món cho ca 3, 2) Trang bị hộp giữ nhiệt, 3) Nhân viên canteen phục vụ đến 23h."

**💡 Kết quả công bố:**
"Nhà ăn đã cải tiến: (1) Thêm 2 món cho ca đêm, (2) Trang bị hộp giữ nhiệt cho thức ăn, (3) Nhân viên canteen phục vụ đến 23h."

---

### Scenario 2: Lỗi kiểm tra QC ca đêm ✅ (Implemented)
- **ID**: `a526420e-52fe-4446-858d-dad7cebcffff`
- **Tiêu đề**: "Tăng cường kiểm tra chất lượng ca đêm"
- **Loại**: Ý kiến (Opinion) - Hòm trắng
- **Trạng thái**: Đã triển khai
- **Workflow**: submitted → supervisor_review → manager_review → implemented

**📜 Lịch sử:**
1. Supervisor: "Thông tin rất hữu ích. Sẽ phân tích số liệu chi tiết."
2. Manager: "Đã phê duyệt: 1) Thêm 1 QC cho ca đêm, 2) Lắp thêm 4 đèn LED khu vực kiểm tra"
3. GM: "Giải pháp tốt, đã triển khai. Tỉ lệ lỗi giảm 12% sau 1 tháng."

---

### Scenario 3: Checklist điện tử dây chuyền lắp ráp 🔄 (In Progress)
- **ID**: `9e63412c-47b2-4aee-8988-9bb3e348c0c4`
- **Tiêu đề**: "Giảm tỉ lệ lỗi dây chuyền lắp ráp bằng checklist điện tử"
- **Loại**: Ý tưởng (Idea) - Hòm trắng
- **Trạng thái**: Đang xem xét
- **Workflow**: submitted → supervisor_review → manager_review (đang ở đây)

**📜 Lịch sử:**
1. Supervisor: "Ý tưởng hay! Sẽ đề xuất lên manager để xem xét chi phí triển khai."
2. Manager: "Đang xem xét với phòng IT về chi phí tablet và phần mềm. Dự kiến pilot ở line 3."

---

### Scenario 4: Màn hình E-kanban khó đọc ✅ (Published)
- **ID**: `60a62866-0035-43f4-a9d7-08456e508cfa`
- **Tiêu đề**: "Cải thiện độ rõ màn hình E-kanban"
- **Loại**: Ý kiến (Opinion) - Hòm trắng
- **Trạng thái**: Đã công bố

---

### Scenario 5: Bữa ăn ca đêm - Tái phát 🔄 (Duplicate)
- **ID**: `c9b0ffa1-e1dc-4067-a7eb-9ec2df68f43b`
- **Tiêu đề**: "Đề nghị cải thiện bữa ăn ca đêm"
- **Loại**: Ý kiến - Hòm trắng
- **Trạng thái**: Đang xem xét
- **Similarity với Scenario 1**: ~89.5%
- **Confirmed Duplicate**: ✅ Yes
- **Note**: Đây là ý kiến tương tự nhưng vấn đề tái phát

---

## 🧪 Cách Demo

### Demo 1: Kiểm tra trùng lặp Ý kiến (Opinion)
**Ngưỡng: 90%**

1. Mở App → Tạo ý kiến mới (Hòm trắng)
2. Nhập:
   - **Tiêu đề**: "Bữa ăn ca 3 không ngon"
   - **Nội dung**: "Cơm nguội, canh nhạt, công nhân ca đêm cần bữa ăn tốt hơn"
3. **Kết quả mong đợi**:
   - RAG phát hiện similar ~85-90%
   - Hiển thị Scenario 1 với:
     - 3 phản hồi đã có
     - Trạng thái: Đã công bố
     - Kết quả triển khai trước đó
   - `can_submit: true` (vì 85% < 90%)
   - User có thể quyết định: submit mới hay bổ sung vào ý kiến cũ

### Demo 2: Kiểm tra trùng lặp Ý tưởng (Idea)
**Ngưỡng: 60%**

1. Mở App → Tạo ý tưởng mới
2. Nhập:
   - **Tiêu đề**: "Dùng AI camera kiểm tra lỗi lắp ráp"
   - **Nội dung**: "Camera AI scan sản phẩm phát hiện lỗi realtime"
3. **Kết quả mong đợi**:
   - RAG phát hiện similar ~65-75% với Scenario 3
   - Hiển thị:
     - Ý tưởng tương tự đang xử lý (checklist điện tử)
     - 2 phản hồi từ supervisor và manager
     - Trạng thái: Đang ở manager_review
   - `needs_confirmation: true` (vì > 60%)
   - User cần xác nhận muốn gửi ý tưởng mới hay hỗ trợ ý tưởng cũ

### Demo 3: Hiển thị lịch sử chi tiết
1. Khi suggestion widget hiện ra
2. Tap vào "Lịch sử xử lý (X)"
3. **Mở rộng hiển thị**:
   - Phần "Phản hồi": Danh sách responses với người phản hồi, thời gian
   - Phần "Lịch sử trạng thái": Timeline các action (created → under_review → approved → implemented)

---

## 🎚️ Ngưỡng Similarity

| Loại | Ngưỡng | Hành vi |
|------|--------|---------|
| Ý tưởng (Idea) | ≤60% | Cho phép gửi |
| Ý tưởng (Idea) | >60% | Cảnh báo, yêu cầu xác nhận |
| Ý kiến (Opinion) | ≤90% | Cho phép gửi |
| Ý kiến (Opinion) | >90% | Cảnh báo, yêu cầu xác nhận |

---

## 🔧 API Endpoints

### Check Duplicate
```bash
POST http://localhost:8001/check-duplicate
Content-Type: application/json

{
  "title": "Bữa ăn ca 3 không ngon",
  "description": "Cơm nguội, canh nhạt...",
  "whitebox_subtype": "opinion",
  "ideabox_type": "white"
}
```

### Response mẫu
```json
{
  "is_duplicate": false,
  "can_submit": true,
  "needs_confirmation": false,
  "similarity_threshold": 0.9,
  "max_similarity": 0.895,
  "message": "Không phát hiện trùng lặp. Bạn có thể gửi ý tưởng.",
  "similar_ideas": [
    {
      "id": "0ec11bf7-...",
      "title": "Cải thiện chất lượng bữa ăn ca 3",
      "similarity": 0.895,
      "status": "published",
      "responses": [...],
      "history": [...]
    }
  ]
}
```

---

## 📱 Screenshots cần chụp

1. **Suggestions Widget**: Hiển thị ý tưởng tương tự với badge %
2. **Workflow History Expanded**: Timeline phản hồi và trạng thái
3. **Confirmation Dialog**: Khi similarity > ngưỡng
4. **Published Response**: Kết quả đã công bố cho user tham khảo

---

## 🚀 Chạy Demo

```bash
# 1. Đảm bảo services đang chạy
cd SmartFactory_CONNECT_Web
docker-compose ps

# 2. Generate embeddings (nếu cần)
curl -X POST "http://localhost:8001/ideas/generate-embeddings?limit=100"

# 3. Kiểm tra stats
curl "http://localhost:8001/ideas/embedding-stats"

# 4. Test check-duplicate
curl -X POST "http://localhost:8001/check-duplicate" \
  -H "Content-Type: application/json" \
  -d '{"title": "Bữa ăn ca 3", "description": "Cơm nguội canh nhạt", "whitebox_subtype": "opinion", "ideabox_type": "white"}'
```

---

## ✅ Checklist Demo

- [ ] RAG service running (port 8001)
- [ ] All ideas have embeddings
- [ ] Mobile app connected to backend
- [ ] Demo các scenario above
- [ ] Chụp screenshots
- [ ] Giải thích logic duplicate detection
