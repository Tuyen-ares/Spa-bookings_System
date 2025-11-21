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

## Xử lý Port bị chiếm

### Tìm process đang sử dụng port 8081:
```powershell
netstat -ano | findstr :8081
```

### Kill process theo PID:
```powershell
taskkill /F /PID <PID_NUMBER>
```

### Tìm và kill process tự động:
```powershell
$port = 8081
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($process) {
    $pid = $process.OwningProcess
    taskkill /F /PID $pid
    Write-Host "Process $pid killed successfully"
}
```

### Khởi động lại Expo sau khi kill process:
```powershell
taskkill /F /PID <PID_NUMBER>
Start-Sleep -Seconds 2
npx expo start -c
```

## Lưu ý

- PowerShell không hỗ trợ cú pháp `rm -rf` như bash/linux
- Sử dụng `Remove-Item -Recurse -Force` thay vì `rm -rf`
- Luôn kiểm tra path tồn tại trước khi xóa: `if (Test-Path ...)`
- Nếu port bị chiếm, thường là do Expo server cũ chưa được tắt đúng cách

