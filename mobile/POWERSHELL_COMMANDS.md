# PowerShell Commands cho Mobile App

## Xóa Cache

### Xóa .expo cache:
```powershell
if (Test-Path .expo) { Remove-Item -Recurse -Force .expo }
```

### Xóa node_modules cache:
```powershell
if (Test-Path node_modules\.cache) { Remove-Item -Recurse -Force node_modules\.cache }
```

### Xóa tất cả cache:
```powershell
if (Test-Path .expo) { Remove-Item -Recurse -Force .expo }
if (Test-Path node_modules\.cache) { Remove-Item -Recurse -Force node_modules\.cache }
Write-Host "Cache cleared successfully!"
```

## Khởi động Expo

### Khởi động với cache cleared:
```powershell
npx expo start --clear
```

### Hoặc:
```powershell
npx expo start -c
```

## Lưu ý

- PowerShell không hỗ trợ cú pháp `rm -rf` như bash/linux
- Sử dụng `Remove-Item -Recurse -Force` thay vì `rm -rf`
- Luôn kiểm tra path tồn tại trước khi xóa: `if (Test-Path ...)`

