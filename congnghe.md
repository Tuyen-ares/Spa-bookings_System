Dự án: Tóm tắt công nghệ

Ngôn ngữ và runtime:

- JavaScript (ES modules / CommonJS)
- TypeScript (ở frontend và mobile)
- Node.js (backend)

Backend:

- Framework: `Express.js`
- ORM: `Sequelize` (migrations trong thư mục `migrations`)
- CSDL: `MySQL` (package `mysql2`)
- Authentication: `jsonwebtoken`, `bcrypt` / `bcryptjs`
- File upload: `multer`
- Scheduling: `node-cron`
- Mail: `nodemailer`
- Payment integration: `vnpay` (package `vnpay`)
- Google GenAI client: `@google/genai`

Frontend (web):

- Framework: `React` (version 19)
- Bundler/dev server: `Vite` (`vite`, `@vitejs/plugin-react`)
- TypeScript support
- Routing: `react-router-dom`
- Charts: `recharts`

Mobile:

- Framework: `React Native` (managed with `Expo`)
- Navigation: `@react-navigation/*`
- Expo SDK (thư viện `expo`, `expo-*`)

Tooling / Scripts:

- Package manager: `npm` (có `package-lock.json` ở gốc)
- Dev server: `nodemon` (backend)
- Linting: `eslint` (mobile has `eslint-config-expo`)
- Type checking/build: `typescript`
- Sequelize CLI for migrations (`sequelize-cli`)

Deployment / Infra config:

- `Procfile` (sẵn cho Heroku-style deployment)
- `railway.json` (cấu hình deploy trên Railway)
- `nixpacks.toml` (nixpacks build config)

Các dấu hiệu khác:

- Có nhiều file `controllers`, `models`, `migrations` → kiến trúc API REST chuẩn.
- Có các file test (ví dụ `test-*.js`) → có tập lệnh test/smoke.

Ghi chú:

- Không tìm thấy thư mục `.git` trong snapshot này, nên không thể khẳng định trạng thái Git từ dữ liệu hiện tại — thường dự án kiểu này dùng Git.
- Thông tin chi tiết hơn (phiên bản Node.js, config môi trường, CI/CD pipelines) có thể lấy từ file cấu hình khác như `Procfile`, `railway.json`, hoặc file cấu hình CI nếu có.

Nếu bạn muốn, tôi có thể:

- Bổ sung phiên bản cụ thể từng package (liệt kê `dependencies` đầy đủ).
- Tạo phần hướng dẫn chạy nhanh (`README` tối giản) cho dev.
