# Phân Tích Chức Năng Tier/TierLevel

## Tổng Quan

File này phân tích các chức năng liên quan đến **tier** (hạng thành viên) và **tierLevel** trong codebase.

---

## 1. TierLevel trong Database

### Bảng `wallets`:
- **Trường**: `tierLevel` (INT, NOT NULL, DEFAULT 1)
- **Mục đích**: Lưu hạng thành viên (1-8)
- **Trạng thái**: ❌ **KHÔNG ĐƯỢC SỬ DỤNG** trong code

### Migration:
- `20250113000010-create-wallets.js` - Tạo bảng với `tierLevel`
- Seed data có set `tierLevel` (1, 2, 3, 4, 5)

---

## 2. Tier được Tính Toán từ Points

### Logic hiện tại:
Code **KHÔNG** sử dụng `wallet.tierLevel` từ database. Thay vào đó, tier được **tính toán động** từ `wallet.points`:

```typescript
// Ví dụ trong ProfilePage.tsx
const currentTier = useMemo(() => {
    if (!wallet) return allTiers[0];
    const userPoints = wallet.points || 0;
    const sortedTiers = [...allTiers].sort((a, b) => (a.pointsRequired || 0) - (b.pointsRequired || 0));
    let tierLevel = 1; // Default to tier 1
    for (let i = sortedTiers.length - 1; i >= 0; i--) {
        if (userPoints >= (sortedTiers[i].pointsRequired || 0)) {
            tierLevel = sortedTiers[i].level;
            break;
        }
    }
    return allTiers.find(t => t.level === tierLevel) || allTiers[0];
}, [wallet, allTiers]);
```

### Vấn đề:
- `allTiers` trong `App.tsx` luôn là **mảng rỗng** (`setAllTiers([])`)
- Comment: "Tiers are calculated dynamically from wallet points, not stored in database"
- **Kết quả**: Tier luôn là `allTiers[0]` (undefined hoặc tier đầu tiên nếu có)

---

## 3. Các Chức Năng Sử Dụng Tier

### 3.1. Frontend - Client Pages

#### `ProfilePage.tsx` (MembershipTab):
- **Mục đích**: Hiển thị hạng thành viên hiện tại
- **Tính năng**:
  - Hiển thị tier name, color, badge
  - Progress bar đến tier tiếp theo
  - Points history
- **Vấn đề**: `allTiers` rỗng → không hiển thị đúng tier

#### `PromotionsPage.tsx`:
- **Props**: Nhận `allTiers` nhưng không sử dụng trực tiếp
- **Mục đích**: Hiển thị promotions/offers

### 3.2. Frontend - Admin Pages

#### `UsersPage.tsx`:
- **Mục đích**: Hiển thị tier của user trong modal chi tiết
- **Logic**: Tính tier từ `wallet.points` và `allTiers`
- **Vấn đề**: `allTiers` rỗng → không hiển thị đúng tier

#### `PromotionsPage.tsx` (Admin):
- **Mục đích**: Quản lý promotions
- **Sử dụng**: `allTiers` để tạo options cho `targetAudience` ("Tier Level 1/2/3")
- **Vấn đề**: `allTiers` rỗng → không có options tier

#### `AddEditPromotionModal.tsx`:
- **Mục đích**: Tạo/sửa promotion
- **Tính năng**: Dropdown "Đối tượng áp dụng" có thể chọn "Tier Level 1/2/3"
- **Code**:
  ```typescript
  const getTierLevelOptions = useMemo(() => {
    return allTiers.map(tier => `Tier Level ${tier.level}` as PromotionTargetAudience);
  }, [allTiers]);
  ```
- **Vấn đề**: `allTiers` rỗng → không có options tier

### 3.3. Components

#### `AddEditTierModal.tsx`:
- **Mục đích**: Modal để chỉnh sửa tier (level, name, pointsRequired, color, etc.)
- **Trạng thái**: Component tồn tại nhưng **không có route/page nào sử dụng**
- **API**: Không có endpoint để lấy/save tiers

---

## 4. Promotion Target Audience

### Enum trong Database:
```sql
-- Cũ (trong migration)
targetAudience enum('All','New Clients','Birthday','Group','VIP','Tier Level 1','Tier Level 2','Tier Level 3')

-- Mới (user đã sửa trong db.txt)
targetAudience enum('All','New Clients','Birthday')
```

### Constants:
- `frontend/constants.tsx`: Vẫn có `'Tier Level 1', 'Tier Level 2', 'Tier Level 3'`
- `backend/constants.js`: Vẫn có `'Tier Level 1', 'Tier Level 2', 'Tier Level 3'`

### Types:
- `frontend/types.ts`: 
  - `PromotionTargetAudience`: Vẫn có `'Tier Level 1' | 'Tier Level 2' | 'Tier Level 3'`
  - `RedeemableVoucher.targetAudience`: Vẫn có `'Tier Level 1' | 'Tier Level 2' | 'Tier Level 3'`

### Vấn đề:
- Database enum đã bị xóa "Tier Level 1/2/3"
- Nhưng code vẫn có references đến tier levels
- **Có thể gây lỗi** khi tạo promotion với targetAudience = "Tier Level 1"

---

## 5. API Endpoints

### `apiService.getTiers()`:
```typescript
export const getTiers = async (): Promise<Tier[]> => Promise.resolve([]);
```
- **Trạng thái**: ❌ **Stub function** - Luôn trả về mảng rỗng
- **Backend**: Không có endpoint `/api/tiers`

### `apiService.updateTier()`:
```typescript
export const updateTier = async (level: number, tierData: Partial<Tier>): Promise<Tier> => 
    update(`${API_BASE_URL}/vouchers/tiers/${level}`, tierData);
```
- **Trạng thái**: ❌ **Endpoint không tồn tại** trong backend

---

## 6. Staff Tier (Khác với Client Tier)

### `StaffTier`:
- **Mục đích**: Hạng của nhân viên (Mới, Thành thạo, Chuyên gia)
- **Logic**: Tính từ số appointment completed và rating
- **Lưu trữ**: Không lưu trong database, chỉ là business rules
- **Constants**: `backend/constants.js` - `STAFF_TIERS`
- **Sử dụng**: `StaffPersonalReportsPage.tsx`, `StaffDashboardPage.tsx`

### Khác biệt:
- **Client Tier**: Dựa trên points, lưu trong `wallets.tierLevel` (nhưng không dùng)
- **Staff Tier**: Dựa trên appointments + rating, không lưu trong database

---

## 7. Tóm Tắt

### ✅ Có trong Database:
- `wallets.tierLevel` - Trường tồn tại nhưng **KHÔNG được sử dụng**

### ✅ Có trong Code:
- Tính toán tier từ points (nhưng `allTiers` rỗng)
- UI components để hiển thị tier
- Promotion có thể target "Tier Level 1/2/3" (nhưng enum đã bị xóa)

### ❌ Không có:
- API endpoint để lấy/save tiers
- Dữ liệu tiers (hardcoded hoặc từ database)
- Logic cập nhật `wallet.tierLevel` khi points thay đổi
- Page để quản lý tiers (AddEditTierModal tồn tại nhưng không có route)

### ⚠️ Vấn đề:
1. **tierLevel trong database không được sử dụng** - Lãng phí storage
2. **allTiers luôn rỗng** - Tier không hoạt động
3. **Promotion target audience** - Enum đã xóa "Tier Level" nhưng code vẫn có references
4. **Không có backend support** - Không thể quản lý tiers

---

## 8. Khuyến Nghị

### Option 1: Xóa hoàn toàn tier functionality
- Xóa `tierLevel` khỏi database
- Xóa các UI components liên quan
- Xóa "Tier Level" khỏi promotion target audience
- Xóa `allTiers` state và props

### Option 2: Implement đầy đủ tier functionality
- Tạo bảng `tiers` trong database
- Tạo API endpoints để CRUD tiers
- Tạo admin page để quản lý tiers
- Cập nhật logic để sync `wallet.tierLevel` khi points thay đổi
- Load `allTiers` từ API thay vì để rỗng
- Restore "Tier Level 1/2/3" vào promotion enum nếu cần

### Option 3: Sử dụng tierLevel từ database
- Bỏ logic tính toán tier từ points
- Sử dụng trực tiếp `wallet.tierLevel`
- Tạo logic cập nhật `tierLevel` khi points thay đổi
- Hardcode tiers hoặc tạo bảng `tiers`

---

## 9. Files Liên Quan

### Frontend:
- `frontend/App.tsx` - `allTiers` state (rỗng)
- `frontend/client/pages/ProfilePage.tsx` - Hiển thị tier
- `frontend/admin/pages/UsersPage.tsx` - Hiển thị tier của user
- `frontend/admin/pages/PromotionsPage.tsx` - Sử dụng tiers cho promotion
- `frontend/admin/components/AddEditTierModal.tsx` - Modal quản lý tier (không dùng)
- `frontend/admin/components/AddEditPromotionModal.tsx` - Dropdown tier levels
- `frontend/constants.tsx` - PROMOTION_TARGET_AUDIENCES
- `frontend/types.ts` - Tier interface, PromotionTargetAudience type

### Backend:
- `backend/models/Wallet.js` - Có `tierLevel` field
- `backend/migrations/20250113000010-create-wallets.js` - Tạo `tierLevel`
- `backend/seeders/20250109100002-seed-wallets.js` - Seed `tierLevel`
- `backend/constants.js` - PROMOTION_TARGET_AUDIENCES
- `backend/models/Promotion.js` - targetAudience enum

### Database:
- `docs/db.txt` - Schema với `wallets.tierLevel`
- `docs/db_chitiet.md` - So sánh schema

