// frontend/src/pages/admin/products/ProductForm.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'; // Giữ lại axios cho fetch dropdown, hoặc chuyển hết sang service
import { createProductAPI, updateProductAPI, deleteProductAPI } from '../../../api/productService'; // Đảm bảo đường dẫn này đúng và có các hàm này

import './ProductForm.css'; // Import CSS cho form này

const API_BASE_URL_CATEGORIES = 'http://localhost:5000/api/admin/categories';
const API_BASE_URL_LABELS = 'http://localhost:5000/api/admin/labels';
const IMAGE_BASE_URL = 'http://localhost:5000'; 

const MAX_IMAGES = 8;

function ProductForm({
    initialData = null,
    isEditMode = false,
    onFormSubmitSuccess, 
    onCancel             
}) {
    const [productName, setProductName] = useState('');
    const [productCode, setProductCode] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [regularPrice, setRegularPrice] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [stockQuantity, setStockQuantity] = useState(0);
    const [selectedLabelId, setSelectedLabelId] = useState('');
    const [stockStatus, setStockStatus] = useState('instock'); 

    const [images, setImages] = useState(Array(MAX_IMAGES).fill(null)); 
    const [imagePreviews, setImagePreviews] = useState(Array(MAX_IMAGES).fill(null)); 
    const [existingImageUrls, setExistingImageUrls] = useState([]); // Để theo dõi ảnh hiện có khi sửa
    const fileInputRefs = useRef([]);

    const [categories, setCategories] = useState([]);
    const [labels, setLabels] = useState([]);
    const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

    const [isSubmitting, setIsSubmitting] = useState(false); 
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const [productIdForEdit, setProductIdForEdit] = useState(null);

    useEffect(() => {
        const fetchDropdownData = async () => {
            setIsLoadingDropdowns(true);
            try {
                const [categoryRes, labelRes] = await Promise.all([
                    axios.get(API_BASE_URL_CATEGORIES),
                    axios.get(API_BASE_URL_LABELS)
                ]);
                setCategories(categoryRes.data || []);
                setLabels(labelRes.data || []);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu cho dropdowns:", error);
                setFormMessage({ type: 'danger', text: 'Không thể tải dữ liệu danh mục/nhãn.' });
            } finally {
                setIsLoadingDropdowns(false);
            }
        };
        fetchDropdownData();
    }, []); 

    useEffect(() => {
        if (isEditMode && initialData) {
            setProductIdForEdit(initialData.id_sp);
            setProductName(initialData.ten || '');
            setProductCode(initialData.sku || '');
            setSelectedCategoryId(initialData.id_loai || '');
            setProductDescription(initialData.mota || '');
            setRegularPrice(initialData.gia !== null ? String(initialData.gia) : '');
            setSalePrice(initialData.gia_khuyen_mai !== null ? String(initialData.gia_khuyen_mai) : '');
            setStockQuantity(initialData.slton !== null ? initialData.slton : 0);
            setSelectedLabelId(initialData.id_nhan || '');
            setStockStatus(initialData.trangthai_tonkho || 'instock'); 

            const newImagePreviews = Array(MAX_IMAGES).fill(null);
            const currentImageUrls = [];
            if (initialData.hinh_anh && initialData.hinh_anh.length > 0) {
                initialData.hinh_anh.forEach((img, index) => {
                    if (index < MAX_IMAGES) {
                        const fullUrl = `${IMAGE_BASE_URL}${img.url_hinh_anh}`;
                        newImagePreviews[index] = fullUrl;
                        currentImageUrls.push(img.url_hinh_anh); // Lưu trữ URL gốc (không có IMAGE_BASE_URL)
                    }
                });
            } else if (initialData.ha_url) { // Fallback cho trường hợp chỉ có 1 ảnh đại diện
                const fullUrl = `${IMAGE_BASE_URL}${initialData.ha_url}`;
                newImagePreviews[0] = fullUrl;
                currentImageUrls.push(initialData.ha_url);
            }
            setImagePreviews(newImagePreviews);
            setExistingImageUrls(currentImageUrls); // Lưu ảnh hiện có
            setImages(Array(MAX_IMAGES).fill(null)); 
        } else { 
            setProductIdForEdit(null);
            setProductName('');
            setProductCode('');
            setSelectedCategoryId('');
            setProductDescription('');
            setRegularPrice('');
            setSalePrice('');
            setStockQuantity(0);
            setSelectedLabelId('');
            setStockStatus('instock');
            setImagePreviews(Array(MAX_IMAGES).fill(null));
            setImages(Array(MAX_IMAGES).fill(null));
            setExistingImageUrls([]);
            if (fileInputRefs.current) { 
               fileInputRefs.current.forEach(ref => { if (ref) ref.value = ""; });
            }
        }
        setFormMessage({ type: '', text: '' }); 
    }, [isEditMode, initialData]);

    const handleImageChange = (index, event) => {
        const file = event.target.files[0];
        if (file) {
            const newImagesState = [...images];
            newImagesState[index] = file;
            setImages(newImagesState);

            const reader = new FileReader();
            reader.onloadend = () => {
                const newImagePreviewsState = [...imagePreviews];
                newImagePreviewsState[index] = reader.result; // Đây là data URL cho preview
                setImagePreviews(newImagePreviewsState);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = (index) => {
        const newImagesState = [...images];
        newImagesState[index] = null;
        setImages(newImagesState);

        const newImagePreviewsState = [...imagePreviews];
        newImagePreviewsState[index] = null;
        setImagePreviews(newImagePreviewsState);

        // Nếu đang ở chế độ sửa, chúng ta cũng cần xóa URL ảnh gốc khỏi existingImageUrls nếu nó có ở đó
        // Điều này quan trọng nếu backend của bạn cần biết ảnh nào đã bị xóa.
        // Tuy nhiên, với logic backend hiện tại (thay thế toàn bộ ảnh nếu có file mới),
        // việc này có thể không cần thiết cho FormData, nhưng hữu ích để quản lý state.
        if (isEditMode) {
            const updatedExistingUrls = [...existingImageUrls];
            if (updatedExistingUrls[index]) { // Kiểm tra xem có URL gốc tại index đó không
                 updatedExistingUrls[index] = null; // Hoặc remove bằng cách filter
                 setExistingImageUrls(updatedExistingUrls.filter(url => url !== null));
            }
        }


        if (fileInputRefs.current[index]) {
            fileInputRefs.current[index].value = ""; 
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setFormMessage({ type: '', text: '' });

        const formData = new FormData();
        formData.append('ten', productName);
        formData.append('sku', productCode);
        formData.append('id_loai', selectedCategoryId);
        formData.append('mota', productDescription);
        formData.append('gia', regularPrice);
        if (salePrice) formData.append('gia_khuyen_mai', salePrice);
        formData.append('slton', stockQuantity);
        if (selectedLabelId) formData.append('id_nhan', selectedLabelId);
        formData.append('trangthai_tonkho', stockStatus); // Gửi trạng thái tồn kho

        // Chỉ gửi các file ảnh mới được chọn.
        // Backend sẽ xử lý việc thay thế ảnh cũ bằng ảnh mới nếu có.
        let hasNewImages = false;
        images.forEach((file) => {
            if (file) {
                formData.append('product_images', file); 
                hasNewImages = true;
            }
        });

        // QUAN TRỌNG: Nếu đang edit và *không* có ảnh mới nào được chọn,
        // và bạn muốn backend giữ lại ảnh cũ, bạn không cần làm gì thêm với FormData về ảnh.
        // Nếu bạn muốn backend xóa hết ảnh cũ nếu không có ảnh mới nào được chọn, bạn cần gửi một cờ.
        // Với logic hiện tại của backend controller (chỉ xử lý `req.files`), nếu không có file mới, ảnh cũ sẽ không bị ảnh hưởng
        // trừ khi model `Product.updateProduct` có logic riêng để xóa ảnh nếu `newImagePaths` rỗng.
        // Để đơn giản, nếu không có `hasNewImages` khi edit, ta không gửi gì liên quan đến `product_images`.
        // Backend `Product.updateProduct` cần biết điều này để không xóa ảnh cũ một cách vô cớ.

        try {
            let responseMessage = '';
            let response;
            if (isEditMode && productIdForEdit) {
                response = await updateProductAPI(productIdForEdit, formData);
                responseMessage = response.message || 'Sản phẩm đã được cập nhật thành công!';
                setFormMessage({ type: 'success', text: responseMessage });
            } else { 
                response = await createProductAPI(formData); 
                responseMessage = response.message || 'Sản phẩm đã được tạo thành công!';
                setFormMessage({ type: 'success', text: responseMessage });

                setProductName(''); setProductCode(''); setSelectedCategoryId(''); setProductDescription('');
                setRegularPrice(''); setSalePrice(''); setStockQuantity(0); setSelectedLabelId('');
                setStockStatus('instock');
                setImagePreviews(Array(MAX_IMAGES).fill(null)); setImages(Array(MAX_IMAGES).fill(null));
                setExistingImageUrls([]);
                if (fileInputRefs.current) {
                    fileInputRefs.current.forEach(ref => { if (ref) ref.value = ""; });
                }
            }

            if (onFormSubmitSuccess) {
                onFormSubmitSuccess(responseMessage, isEditMode ? 'edit' : 'add', response.product);
            }

        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Đã có lỗi xảy ra khi xử lý sản phẩm.';
            setFormMessage({ type: 'danger', text: errorMessage });
            console.error("Lỗi khi submit sản phẩm:", error.response || error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async () => {
        if (!productIdForEdit) return;
        if (window.confirm(`Bạn có chắc muốn xóa sản phẩm "${productName || 'này'}" (ID: ${productIdForEdit}) không? Hành động này không thể hoàn tác.`)) {
            setIsSubmitting(true);
            setFormMessage({ type: '', text: '' });
            try {
                const response = await deleteProductAPI(productIdForEdit);
                const successMessage = response.message || `Sản phẩm ID ${productIdForEdit} đã được xóa thành công.`;
                setFormMessage({ type: 'success', text: successMessage });
                if (onFormSubmitSuccess) {
                    onFormSubmitSuccess(successMessage, 'delete');
                }
                // Không cần reset form ở đây vì modal sẽ đóng.
            } catch (error) {
                const errorMessage = error.response?.data?.message || 'Lỗi khi xóa sản phẩm.';
                setFormMessage({ type: 'danger', text: errorMessage });
                console.error("Lỗi khi xóa sản phẩm:", error.response || error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };
    
    return (
        <>
            {formMessage.text && (
                <div
                    className={`alert alert-${formMessage.type}`} 
                    style={{ 
                        marginBottom: "15px", 
                        padding: "12px", 
                        borderRadius: "6px", 
                        textAlign: 'center', 
                        color: 'var(--white)',
                        backgroundColor: `var(--${formMessage.type}-color, var(--info-color))` 
                    }}
                >
                    {formMessage.text}
                </div>
            )}

            <form id="productModalFormInternal" onSubmit={handleSubmit}>
                {/* Thông tin cơ bản */}
                <div className="form-container">
                    <div className="form-section">
                        <h2 className="section-title">Thông tin cơ bản</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label" htmlFor="modalProductName">Tên sản phẩm <span style={{ color: 'red' }}>*</span></label>
                                <input type="text" id="modalProductName" value={productName} onChange={e => setProductName(e.target.value)} className="form-input" placeholder="Nhập tên sản phẩm" required disabled={isSubmitting} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="modalProductCode">Mã sản phẩm (SKU)</label>
                                <input type="text" id="modalProductCode" value={productCode} onChange={e => setProductCode(e.target.value)} className="form-input" placeholder="VD: HM-TS001" disabled={isSubmitting} />
                                <div className="input-hint">Để trống nếu muốn hệ thống tự tạo.</div>
                            </div>
                            <div className="form-group full-width">
                                <label className="form-label" htmlFor="modalProductCategory">Danh mục <span style={{ color: 'red' }}>*</span></label>
                                <select id="modalProductCategory" value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="form-select" required disabled={isLoadingDropdowns || isSubmitting}>
                                    <option value="">-- {isLoadingDropdowns ? 'Đang tải...' : 'Chọn danh mục'} --</option>
                                    {!isLoadingDropdowns && categories.map(cat => (
                                        <option key={cat.id_loai} value={cat.id_loai}>{cat.ten}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group full-width">
                                <label className="form-label" htmlFor="modalProductDescription">Mô tả sản phẩm</label>
                                <textarea id="modalProductDescription" value={productDescription} onChange={e => setProductDescription(e.target.value)} className="form-textarea" placeholder="Nhập mô tả chi tiết..." disabled={isSubmitting}></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hình ảnh sản phẩm */}
                <div className="form-container">
                    <div className="form-section">
                        <h2 className="section-title">Hình ảnh sản phẩm</h2>
                        <div className="form-group">
                            <label className="form-label">Tải ảnh lên (ảnh đầu tiên sẽ là ảnh đại diện, tối đa {MAX_IMAGES} ảnh)</label>
                            <div className="image-upload-container" id="imageUploadContainer">
                                {Array.from({ length: MAX_IMAGES }).map((_, index) => (
                                    <div key={index} className={`image-upload-box ${imagePreviews[index] ? 'has-image' : ''}`}>
                                        {imagePreviews[index] ? (
                                            <img src={imagePreviews[index]} alt={`Xem trước ${index + 1}`} className="image-preview" />
                                        ) : ( <> <i className="fas fa-image"></i> <div className="upload-text">{index === 0 ? 'Ảnh đại diện' : `Ảnh ${index + 1}`}</div> </> )}
                                        <input 
                                            type="file" 
                                            name={`product_image_slot_${index}`} 
                                            className="image-upload-input" 
                                            accept="image/*" 
                                            onChange={(e) => handleImageChange(index, e)} 
                                            ref={el => fileInputRefs.current[index] = el} 
                                            disabled={isSubmitting}
                                        />
                                        {imagePreviews[index] && !isSubmitting && (<button type="button" className="remove-image-btn" title="Xóa ảnh" onClick={() => handleRemoveImage(index)}>×</button>)}
                                    </div>
                                ))}
                            </div>
                            <div className="input-hint">Định dạng: JPG, PNG, GIF. Kích thước khuyến nghị: 800x800px.</div>
                             {isEditMode && existingImageUrls.length > 0 && !images.some(img => img !== null) && (
                                <div className="input-hint" style={{marginTop: '10px', color: 'var(--primary-color)'}}>
                                    Hiện có {existingImageUrls.filter(url=>url).length} ảnh. Chọn file mới để thay thế. Nếu không chọn file mới, ảnh hiện tại sẽ được giữ lại.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Giá & Tồn kho */}
                <div className="form-container">
                    <div className="form-section">
                        <h2 className="section-title">Giá & Tồn kho</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label" htmlFor="modalRegularPrice">Giá bán (VNĐ) <span style={{ color: 'red' }}>*</span></label>
                                <input type="number" id="modalRegularPrice" value={regularPrice} onChange={e => setRegularPrice(e.target.value)} className="form-input" placeholder="0" min="0" required disabled={isSubmitting}/>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="modalSalePrice">Giá khuyến mãi (VNĐ)</label>
                                <input type="number" id="modalSalePrice" value={salePrice} onChange={e => setSalePrice(e.target.value)} className="form-input" placeholder="0" min="0" disabled={isSubmitting}/>
                                <div className="input-hint">Để trống nếu không áp dụng khuyến mãi.</div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="modalStockQuantity">Số lượng tồn kho <span style={{ color: 'red' }}>*</span></label>
                                <input type="number" id="modalStockQuantity" value={stockQuantity} onChange={e => setStockQuantity(parseInt(e.target.value, 10) || 0)} className="form-input" placeholder="0" min="0" required disabled={isSubmitting}/>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="modalStockStatus">Trạng thái tồn kho</label>
                                <select id="modalStockStatus" value={stockStatus} onChange={e => setStockStatus(e.target.value)} className="form-select" disabled={isSubmitting}>
                                    <option value="instock">Còn hàng</option>
                                    <option value="outofstock">Hết hàng</option>
                                    <option value="onbackorder">Cho phép đặt trước</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nhãn sản phẩm */}
                <div className="form-container">
                    <div className="form-section">
                        <div className="section-header-extra">
                           <h2 className="section-title" style={{borderBottom:'none', marginBottom:0}}>Nhãn chính sản phẩm</h2>
                        </div>
                        <div className="form-group" style={{marginTop: '15px'}}>
                            <select 
                                id="modalProductLabel" 
                                value={selectedLabelId} 
                                onChange={e => setSelectedLabelId(e.target.value)} 
                                className="form-select"
                                disabled={isLoadingDropdowns || isSubmitting}
                            >
                                <option value="">-- {isLoadingDropdowns ? 'Đang tải...' : 'Chọn nhãn chính'} --</option>
                                {!isLoadingDropdowns && labels.map(label => (
                                    <option key={label.id_nhan} value={label.id_nhan} style={{color: label.mau_sac_hex || 'inherit'}}>
                                        {label.ten_nhan}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="input-hint">Chọn một nhãn chính cho sản phẩm (nếu có).</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="form-actions" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                    <div className="left-actions">
                        {isEditMode && productIdForEdit && ( 
                            <button 
                                type="button" 
                                className="action-btn delete-btn" 
                                onClick={handleDeleteProduct} // Sử dụng hàm mới
                                disabled={isSubmitting}
                            >
                                <i className="fas fa-trash"></i> Xóa sản phẩm
                            </button>
                        )}
                    </div>
                    <div className="right-actions">
                        <button 
                            type="button" 
                            className="action-btn save-draft-btn" 
                            onClick={onCancel} 
                            disabled={isSubmitting}
                        >
                             Hủy
                        </button>
                        <button 
                            type="submit" 
                            className="action-btn publish-btn" 
                            disabled={isSubmitting || isLoadingDropdowns} 
                        >
                            {isSubmitting ? (
                                <span className="loading" style={{borderColor: 'var(--white)', borderTopColor: 'transparent'}}></span>
                            ) : (
                                <i className="fas fa-check-circle"></i>
                            )}
                            {isSubmitting ? (isEditMode ? 'Đang cập nhật...' : 'Đang thêm...') : (isEditMode ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm')}
                        </button>
                    </div>
                </div>
            </form>
        </>
    );
}

export default ProductForm;