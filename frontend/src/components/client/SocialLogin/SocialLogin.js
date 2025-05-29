import React from 'react';
import './SocialLogin.css';

const SocialLogin = ({ onSuccess }) => {
  // Facebook OAuth URL
  const FACEBOOK_APP_ID = 'YOUR_FACEBOOK_APP_ID'; // Thay bằng Facebook App ID thực tế
  const FACEBOOK_REDIRECT_URI = encodeURIComponent(window.location.origin + '/auth/facebook/callback');
  const facebookOAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&scope=email,public_profile&response_type=code`;

  // Google OAuth URL
  const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // Thay bằng Google Client ID thực tế
  const GOOGLE_REDIRECT_URI = encodeURIComponent(window.location.origin + '/auth/google/callback');
  const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`;

  const handleFacebookLogin = () => {
    // Mở cửa sổ popup để đăng nhập Facebook
    const width = 500;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      facebookOAuthUrl,
      'facebook-login',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Kiểm tra popup để xử lý callback
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup);
        return;
      }

      try {
        if (popup.location.href.includes('/auth/facebook/callback')) {
          // Xử lý callback ở đây
          clearInterval(checkPopup);
          popup.close();
          // Gọi onSuccess với data từ Facebook
          if (onSuccess) {
            onSuccess('facebook', { message: 'Đăng nhập Facebook thành công!' });
          }
        }
      } catch (e) {
        // Cross-origin error - bỏ qua
      }
    }, 100);
  };

  const handleGoogleLogin = () => {
    // Mở cửa sổ popup để đăng nhập Google
    const width = 500;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      googleOAuthUrl,
      'google-login',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Kiểm tra popup để xử lý callback
    const checkPopup = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkPopup);
        return;
      }

      try {
        if (popup.location.href.includes('/auth/google/callback')) {
          // Xử lý callback ở đây
          clearInterval(checkPopup);
          popup.close();
          // Gọi onSuccess với data từ Google
          if (onSuccess) {
            onSuccess('google', { message: 'Đăng nhập Google thành công!' });
          }
        }
      } catch (e) {
        // Cross-origin error - bỏ qua
      }
    }, 100);
  };

  return (
    <>
      <div className="divider">
        <div className="divider-line"></div>
        <div className="divider-text">Hoặc đăng nhập với</div>
        <div className="divider-line"></div>
      </div>
      
      <div className="social-login">
        <button 
          type="button"
          className="social-btn social-btn-facebook"
          onClick={handleFacebookLogin}
        >
          <i className="fab fa-facebook-f"></i> Facebook
        </button>
        <button 
          type="button"
          className="social-btn social-btn-google"
          onClick={handleGoogleLogin}
        >
          <i className="fab fa-google"></i> Google
        </button>
      </div>
    </>
  );
};

export default SocialLogin;