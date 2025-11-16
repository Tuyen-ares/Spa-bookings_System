# Hướng dẫn chạy migration để thay đổi giảm giá sang phần trăm

## Chạy migration:

```bash
cd backend
npx sequelize-cli db:migrate
```

## Nếu có lỗi hoặc muốn rollback:

```bash
npx sequelize-cli db:migrate:undo
```

## Sau khi migrate xong, restart backend:

```bash
npm start
```

## Thay đổi:

- ✅ Thay `discountPrice` (số tiền cố định) → `discountPercent` (phần trăm 0-100)
- ✅ `discountPrice` giờ được tính tự động từ backend: `price * (1 - discountPercent/100)`
- ✅ Frontend hiển thị giá sau giảm real-time khi nhập phần trăm
- ✅ Validate discountPercent từ 0-100
