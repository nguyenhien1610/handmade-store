# Hướng dẫn cấu hình OAuth cho Facebook và Google

## 1. Cấu hình Facebook OAuth

### Bước 1: Tạo Facebook App
1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Chọn "Consumer" → Next
4. Điền thông tin app và tạo

### Bước 2: Cấu hình Facebook Login
1. Trong Dashboard, chọn "Add Product" → "Facebook Login" → "Set Up"
2. Chọn "Web"
3. Nhập Site URL: `http://localhost:5173` (cho development)
4. Trong Settings của Facebook Login:
   - Valid OAuth Redirect URIs: 
     - `http://localhost:5173/auth/facebook/callback`
     - `https://yourdomain.com/auth/facebook/callback` (cho production)

### Bước 3: Lấy App ID
1. Vào Settings → Basic
2. Copy "App ID"
3. Cập nhật trong file `/src/components/client/SocialLogin/SocialLogin.js`:
```javascript
const FACEBOOK_APP_ID = 'YOUR_ACTUAL_FACEBOOK_APP_ID';
```

## 2. Cấu hình Google OAuth

### Bước 1: Tạo Google Project
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn

### Bước 2: Enable Google+ API
1. Vào "APIs & Services" → "Library"
2. Tìm "Google+ API" và enable

### Bước 3: Tạo OAuth 2.0 Credentials
1. Vào "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Chọn "Web application"
4. Thêm:
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `https://yourdomain.com`
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/google/callback`
     - `https://yourdomain.com/auth/google/callback`

### Bước 4: Lấy Client ID
1. Copy "Client ID" từ credentials vừa tạo
2. Cập nhật trong file `/src/components/client/SocialLogin/SocialLogin.js`:
```javascript
const GOOGLE_CLIENT_ID = 'YOUR_ACTUAL_GOOGLE_CLIENT_ID';
```

## 3. Xử lý Callback Routes

Bạn cần tạo routes để xử lý callback từ Facebook và Google:

```javascript
// Thêm vào routes/index.js
<Route path="/auth/facebook/callback" element={<OAuthCallback provider="facebook" />} />
<Route path="/auth/google/callback" element={<OAuthCallback provider="google" />} />
```

## 4. Backend Integration

Backend cần endpoints để:
1. Xác thực OAuth token từ Facebook/Google
2. Tạo hoặc cập nhật user trong database
3. Trả về JWT token cho frontend

Ví dụ endpoints:
- `POST /api/auth/facebook`
- `POST /api/auth/google`

## Lưu ý bảo mật
- KHÔNG commit App ID/Client ID vào git
- Sử dụng environment variables cho production
- Kiểm tra domain whitelist kỹ càng