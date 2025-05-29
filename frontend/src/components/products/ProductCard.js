// frontend/src/components/products/ProductCard.js (Phiên bản phù hợp với modal)
import React from 'react';
// Bỏ Link nếu nút Sửa chỉ để mở modal do ProductListPage quản lý
// import { Link } from 'react-router-dom'; 
import './ProductCard.css'; 

const IMAGE_BASE_URL = 'http://localhost:5000'; // Cổng backend của bạn

const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Thêm prop onEdit
function ProductCard({ product, onDelete, onEdit }) { 
    const primaryImage = product.hinh_anh && product.hinh_anh.length > 0 
        ? product.hinh_anh[0].url_hinh_anh 
        : product.ha_url;
    const imageUrl = primaryImage ? `${IMAGE_BASE_URL}${primaryImage}` : null;

    return (
        <div className="product-card">
            <div className="product-image">
                {imageUrl ? (
                    <img src={imageUrl} alt={product.ten} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <i className="fas fa-image" style={{ fontSize: '60px', color: 'var(--dark-pink)' }}></i>
                )}
                <div className="product-badges">
                    {product.noi_bat === 1 && <span className="product-badge hot-badge">Hot</span>}
                    {product.ten_nhan_chinh && (
                        <span 
                            className="product-badge" 
                            style={{ backgroundColor: product.mau_nhan_chinh || 'var(--info-color)', color: 'white' }}
                        >
                            {product.ten_nhan_chinh}
                        </span>
                    )}
                    {product.slton === 0 && <span className="product-badge out-of-stock-badge">Hết hàng</span>}
                </div>
                <div className="product-actions">
                    {/* SỬA Ở ĐÂY: Dùng button và gọi onEdit */}
                    <button 
                        onClick={onEdit} // Gọi hàm onEdit được truyền từ ProductListPage
                        className="product-action-btn" 
                        title="Chỉnh sửa"
                    >
                        <i className="fas fa-edit"></i>
                    </button>
                    <button 
                        className="product-action-btn" 
                        title="Xóa" 
                        onClick={() => onDelete(product.id_sp, product.ten)}
                    >
                        <i className="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div className="product-info">
                <h3 className="product-name">{product.ten || 'Chưa có tên'}</h3>
                <div className="product-meta">
                    <span className="product-category">{product.ten_loai || 'Chưa có loại'}</span>
                    <span className="product-id">SP{String(product.id_sp).padStart(3, '0')}</span>
                </div>
                <p className="product-description">
                    {product.mota || 'Chưa có mô tả.'}
                </p>
                <div className="product-details">
                    <div className="product-price">{formatCurrency(product.gia_khuyen_mai || product.gia)}</div>
                    <div className="product-stock">
                        Tồn: {product.slton !== null ? product.slton : 'N/A'}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductCard;