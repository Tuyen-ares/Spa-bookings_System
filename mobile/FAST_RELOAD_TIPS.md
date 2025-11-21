# Tips để tăng tốc Reload trong Expo

## Vấn đề: Reload chậm

Reload chậm thường do:
1. Metro bundler phải rebuild nhiều modules (1821 modules)
2. Cache chưa được tối ưu
3. Có lỗi trong code khiến bundler phải retry

## Giải pháp

### 1. Sử dụng Fast Refresh thay vì Full Reload

- **Fast Refresh**: Chỉ reload component đã thay đổi (nhanh hơn)
- **Full Reload**: Reload toàn bộ app (chậm hơn)

**Cách sử dụng:**
- Chỉnh sửa code → Tự động Fast Refresh
- Nhấn `r` trong terminal → Full Reload (chậm)
- Nhấn `Shift + r` → Hard Reload (rất chậm)

### 2. Tối ưu Metro Config

Đã tạo `metro.config.js` để tối ưu bundling performance.

### 3. Clear Cache khi cần

```powershell
# Clear cache và restart
if (Test-Path .expo) { Remove-Item -Recurse -Force .expo }
if (Test-Path node_modules\.cache) { Remove-Item -Recurse -Force node_modules\.cache }
npx expo start -c
```

### 4. Sử dụng Development Build thay vì Expo Go

Expo Go phải bundle lại mỗi lần reload. Development Build nhanh hơn nhiều.

### 5. Giảm số lượng modules

- Tránh import không cần thiết
- Sử dụng tree-shaking
- Lazy load các components lớn

## Lưu ý

- **Lần đầu bundle**: Luôn chậm (30-60 giây) - bình thường
- **Fast Refresh**: 1-3 giây - nhanh
- **Full Reload**: 10-30 giây - chậm nhưng cần thiết khi có lỗi

## Khi nào cần Full Reload?

- Thay đổi `app.json` hoặc `babel.config.js`
- Thay đổi native code
- Có lỗi runtime nghiêm trọng
- Thay đổi navigation structure

## Khi nào chỉ cần Fast Refresh?

- Thay đổi component UI
- Thay đổi styles
- Thay đổi logic trong component
- Thay đổi state management

