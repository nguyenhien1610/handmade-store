// frontend/src/components/SocialMediaConfig/SocialMediaConfig.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';
import './SocialMedia.css';

// URL API backend, điều chỉnh nếu cổng backend của bạn khác
const API_URL = 'http://localhost:5000/api/admin/social-media';

// Hàm helper để tạo URL đầy đủ, kiểm tra nếu đã có http/https
const createFullUrl = (path) => {
    if (!path || path.trim() === '') return '#'; // Trả về '#' nếu path rỗng
    const trimmedPath = path.trim();
    if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
        return trimmedPath; // Nếu đã có http/https thì giữ nguyên
    }
    return `https://${trimmedPath}`; // Mặc định thêm https://
};

const SocialMediaConfig = () => {
    // State để lưu trữ dữ liệu form
    const [formData, setFormData] = useState({
        facebook: '',
        instagram: '',
        tiktok: '',
        shopee: ''
    });
    // State để lưu trữ dữ liệu ban đầu (lấy từ server) để dùng cho nút "Hủy"
    const [initialData, setInitialData] = useState({});
    // State cho thông báo toast
    const [toast, setToast] = useState({ show: false, message: '' });

    // Hàm để lấy dữ liệu liên kết mạng xã hội từ backend
    const fetchSocialMediaLinks = useCallback(async () => {
        try {
            const response = await axios.get(API_URL);
            const data = response.data;
            const newFormData = {
                facebook: data.facebook || '',
                instagram: data.instagram || '',
                tiktok: data.tiktok || '',
                shopee: data.shopee || ''
            };
            setFormData(newFormData);
            setInitialData(newFormData); // Lưu lại để dùng cho nút Hủy
        } catch (error) {
            console.error("Lỗi khi tải cấu hình mạng xã hội:", error);
            showToast("Lỗi khi tải cấu hình!");
        }
    }, []); // Mảng rỗng đảm bảo hàm này chỉ được tạo một lần

    // useEffect để gọi fetchSocialMediaLinks khi component được mount lần đầu
    useEffect(() => {
        fetchSocialMediaLinks();
    }, [fetchSocialMediaLinks]);

    // Hàm xử lý khi giá trị input thay đổi
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevData => ({ ...prevData, [id]: value }));
    };

    // Hàm hiển thị thông báo toast
    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => {
            setToast({ show: false, message: '' });
        }, 3000);
    };

    // Hàm xử lý khi submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                facebook: formData.facebook.trim(),
                instagram: formData.instagram.trim(),
                tiktok: formData.tiktok.trim(),
                shopee: formData.shopee.trim(),
            };
            await axios.put(API_URL, payload);
            showToast('Cấu hình đã được lưu thành công!');
            fetchSocialMediaLinks(); // Tải lại dữ liệu để cập nhật initialData
        } catch (error) {
            console.error("Lỗi khi lưu cấu hình mạng xã hội:", error);
            showToast('Lưu cấu hình thất bại!');
        }
    };

    // Hàm xử lý khi nhấn nút "Hủy"
    const handleCancel = () => {
        setFormData(initialData);
    };

    // Hàm xác định trạng thái cho phần xem trước
    const getPreviewStatus = (platformUrl) => {
        return platformUrl && platformUrl.trim() !== ''
            ? { text: 'Đã cấu hình', className: 'social-status status-active' }
            : { text: 'Chưa cấu hình', className: 'social-status status-inactive' };
    };

    const facebookStatus = getPreviewStatus(formData.facebook);
    const instagramStatus = getPreviewStatus(formData.instagram);
    const tiktokStatus = getPreviewStatus(formData.tiktok);
    const shopeeStatus = getPreviewStatus(formData.shopee);

    const isLinkValid = (link) => link && link.trim() !== '';

    return (
        <div className="social-media-config-page">
            <div className="main-container">
                <main className="content">
                    <div className="page-header">
                        <h1 className="page-title">Cấu hình mạng xã hội</h1>
                        <p className="page-description">Quản lý các liên kết mạng xã hội để hiển thị trên website của bạn</p>
                    </div>

                    <div className="form-container">
                        <form id="socialMediaForm" onSubmit={handleSubmit}>
                            {/* Phần Facebook */}
                            <div className="form-section">
                                <h3 className="section-title"><i className="fab fa-facebook"></i> Facebook</h3>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="facebook">Link trang Facebook</label>
                                    <div className="input-group">
                                        <div className="input-group-prepend">https://</div>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            id="facebook"
                                            placeholder="facebook.com/yourbusiness"
                                            value={formData.facebook}
                                            onChange={handleInputChange} 
                                        />
                                    </div>
                                    <p className="help-text">Nhập địa chỉ trang Facebook (ví dụ: facebook.com/yourpage)</p>
                                </div>
                            </div>

                            {/* Phần Instagram */}
                            <div className="form-section">
                                <h3 className="section-title"><i className="fab fa-instagram"></i> Instagram</h3>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="instagram">Link trang Instagram</label>
                                    <div className="input-group">
                                        <div className="input-group-prepend">https://</div>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            id="instagram" 
                                            placeholder="instagram.com/yourusername"
                                            value={formData.instagram}
                                            onChange={handleInputChange} 
                                        />
                                    </div>
                                    <p className="help-text">Nhập địa chỉ trang Instagram (ví dụ: instagram.com/yourprofile)</p>
                                </div>
                            </div>

                            {/* Phần TikTok */}
                            <div className="form-section">
                                <h3 className="section-title"><i className="fab fa-tiktok"></i> TikTok</h3>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="tiktok">Link trang TikTok</label>
                                    <div className="input-group">
                                        <div className="input-group-prepend">https://</div>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            id="tiktok" 
                                            placeholder="tiktok.com/@yourusername"
                                            value={formData.tiktok}
                                            onChange={handleInputChange} 
                                        />
                                    </div>
                                    <p className="help-text">Nhập địa chỉ trang TikTok (ví dụ: tiktok.com/@yourchannel)</p>
                                </div>
                            </div>

                            {/* Phần Shopee */}
                            <div className="form-section">
                                <h3 className="section-title"><i className="fas fa-shopping-cart"></i> Shopee</h3>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="shopee">Link trang Shopee</label>
                                    <div className="input-group">
                                        <div className="input-group-prepend">https://</div>
                                        <input 
                                            type="text" 
                                            className="form-input" 
                                            id="shopee" 
                                            placeholder="shopee.vn/yourshop"
                                            value={formData.shopee}
                                            onChange={handleInputChange} 
                                        />
                                    </div>
                                    <p className="help-text">Nhập địa chỉ trang Shopee (ví dụ: shopee.vn/yourshopname)</p>
                                </div>
                            </div>

                            <div className="btn-container">
                                <button type="button" className="btn btn-secondary" onClick={handleCancel}>Hủy</button>
                                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
                            </div>
                        </form>
                    </div>

                    <div className="preview-section">
                        <div className="preview-header">
                            <h3 className="preview-title">Xem trước</h3>
                            <p className="preview-description">Nhấp vào icon để kiểm tra liên kết (sẽ mở trong tab mới)</p>
                        </div>
                        <div className="social-preview">
                            <a 
                                href={isLinkValid(formData.facebook) ? createFullUrl(formData.facebook) : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`social-item ${!isLinkValid(formData.facebook) ? 'disabled-link' : ''}`}
                                id="facebookPreview"
                                onClick={(e) => !isLinkValid(formData.facebook) && e.preventDefault()}
                            >
                                <div className="social-icon facebook">
                                    <i className="fab fa-facebook-f"></i>
                                </div>
                                <div className="social-name">Facebook</div>
                                <div className={facebookStatus.className}>{facebookStatus.text}</div>
                            </a>
                            
                            <a
                                href={isLinkValid(formData.instagram) ? createFullUrl(formData.instagram) : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`social-item ${!isLinkValid(formData.instagram) ? 'disabled-link' : ''}`}
                                id="instagramPreview"
                                onClick={(e) => !isLinkValid(formData.instagram) && e.preventDefault()}
                            >
                                <div className="social-icon instagram">
                                    <i className="fab fa-instagram"></i>
                                </div>
                                <div className="social-name">Instagram</div>
                                <div className={instagramStatus.className}>{instagramStatus.text}</div>
                            </a>

                            <a
                                href={isLinkValid(formData.tiktok) ? createFullUrl(formData.tiktok) : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`social-item ${!isLinkValid(formData.tiktok) ? 'disabled-link' : ''}`}
                                id="tiktokPreview"
                                onClick={(e) => !isLinkValid(formData.tiktok) && e.preventDefault()}
                            >
                                <div className="social-icon tiktok">
                                    <i className="fab fa-tiktok"></i>
                                </div>
                                <div className="social-name">TikTok</div>
                                <div className={tiktokStatus.className}>{tiktokStatus.text}</div>
                            </a>

                            <a
                                href={isLinkValid(formData.shopee) ? createFullUrl(formData.shopee) : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`social-item ${!isLinkValid(formData.shopee) ? 'disabled-link' : ''}`}
                                id="shopeePreview"
                                onClick={(e) => !isLinkValid(formData.shopee) && e.preventDefault()}
                            >
                                <div className="social-icon shopee">
                                    <i className="fas fa-shopping-basket"></i> {/* Bạn có thể dùng fa-store hoặc icon Shopee SVG nếu có */}
                                </div>
                                <div className="social-name">Shopee</div>
                                <div className={shopeeStatus.className}>{shopeeStatus.text}</div>
                            </a>
                        </div>
                    </div>
                </main>
            </div>

            {toast.show && (
                <div className={`toast ${toast.show ? 'show' : ''}`}>
                    {/* Icon có thể thay đổi tùy theo loại toast (success/error) */}
                    <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i> 
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default SocialMediaConfig;