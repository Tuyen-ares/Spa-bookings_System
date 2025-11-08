# PowerShell script to create backend/.env file
# Run this script from the project root directory

$envContent = @"
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=anhthospa_db
DB_USER=root
DB_PASSWORD=your_password_here

# Server Configuration
PORT=3001

# JWT Secret for authentication
JWT_SECRET=your_jwt_secret_key_here_change_in_production

# Database Sync Options
DB_ALTER_ON_START=false

# Gemini AI API Key for Chatbot
GEMINI_API_KEY=AIzaSyCDAE9vYGnzeiOfkligU4d27-kHj4tnqDk
"@

# Create backend directory if it doesn't exist
if (-not (Test-Path "backend")) {
    Write-Host "Error: backend directory not found!"
    exit 1
}

# Create .env file
$envPath = "backend\.env"
Set-Content -Path $envPath -Value $envContent -Encoding UTF8

Write-Host "✅ File backend/.env created successfully!"
Write-Host ""
Write-Host "⚠️  IMPORTANT: Please update the following in backend/.env:"
Write-Host "   1. DB_PASSWORD - Replace 'your_password_here' with your MySQL password"
Write-Host "   2. JWT_SECRET - Replace with a random secret key"
Write-Host ""
Write-Host "After updating, restart the backend server:"
Write-Host "   cd backend"
Write-Host "   npm start"

