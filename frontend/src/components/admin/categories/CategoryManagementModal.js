// frontend/src/components/admin/categories/CategoryManagementModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Hoặc dùng service nếu bạn đã tạo
import './CategoryManagementModal.css'; // Tạo file CSS này

const API_BASE_URL_CATEGORIES = 'http://localhost:5000/api/admin/categories'; // Cổng backend của bạn

function CategoryManagementModal({ isOpen, onClose, onCategoriesUpdate }) {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // State cho form thêm mới
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDescription, setNewCategoryDescription] = useState('');

    // State cho form sửa (trong sub-modal hoặc inline)
    const [editingCategory, setEditingCategory] = useState(null); // { id, ten, mota }
    const [editCategoryName, setEditCategoryName] = useState('');
    const [editCategoryDescription, setEditCategoryDescription] = useState('');
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);


    const fetchCategories = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_BASE_URL_CATEGORIES);
            setCategories(response.data || []);
        } catch (err) {
            setError('Không thể tải danh sách danh mục.');
            console.error("Lỗi tải danh mục trong modal:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]); // Tải lại danh mục mỗi khi modal được mở

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            alert('Tên danh mục không được để trống.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.post(API_BASE_URL_CATEGORIES, {
                ten: newCategoryName,
                mota: newCategoryDescription,
            });
            // setCategories([...categories, response.data]); // Thêm vào danh sách hiện tại
            await fetchCategories(); // Tải lại toàn bộ danh sách để có số lượng SP đúng
            setNewCategoryName('');
            setNewCategoryDescription('');
            if (onCategoriesUpdate) onCategoriesUpdate(); // Thông báo cho component cha
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi thêm danh mục.');
            console.error("Lỗi thêm danh mục:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCategory = async (categoryId, categoryName) => {
        if (window.confirm(`Bạn có chắc muốn xóa danh mục "${categoryName}" không?`)) {
            setIsLoading(true);
            try {
                await axios.delete(`${API_BASE_URL_CATEGORIES}/${categoryId}`);
                // setCategories(categories.filter(cat => cat.id_loai !== categoryId));
                await fetchCategories(); // Tải lại danh sách
                if (onCategoriesUpdate) onCategoriesUpdate();
            } catch (err) {
                setError(err.response?.data?.message || 'Lỗi khi xóa danh mục.');
                console.error("Lỗi xóa danh mục:", err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setEditCategoryName(category.ten);
        setEditCategoryDescription(category.mota || '');
        setIsEditModalVisible(true);
    };

    const closeEditModal = () => {
        setIsEditModalVisible(false);
        setEditingCategory(null);
    };

    const handleEditCategory = async (e) => {
        e.preventDefault();
        if (!editCategoryName.trim() || !editingCategory) {
            alert('Thông tin không hợp lệ.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.put(`${API_BASE_URL_CATEGORIES}/${editingCategory.id_loai}`, {
                ten: editCategoryName,
                mota: editCategoryDescription,
            });
            // const updatedCategories = categories.map(cat =>
            //     cat.id_loai === editingCategory.id_loai ? response.data : cat
            // );
            // setCategories(updatedCategories);
            await fetchCategories(); // Tải lại danh sách
            closeEditModal();
            if (onCategoriesUpdate) onCategoriesUpdate();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi cập nhật danh mục.');
            console.error("Lỗi cập nhật danh mục:", err);
        } finally {
            setIsLoading(false);
        }
    };


    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div className="modal category-management-modal" onClick={e => e.stopPropagation()}> {/* Thêm class riêng */}
                <div className="modal-header">
                    <h2 className="modal-title">Quản lý Danh mục</h2>
                    <button type="button" className="close-modal-btn" aria-label="Close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
                    
                    <form onSubmit={handleAddCategory} className="add-category-form">
                        <input 
                            type="text" 
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            className="add-category-input" 
                            placeholder="Tên danh mục mới" 
                            required 
                            disabled={isLoading}
                        />
                        <input 
                            type="text" 
                            value={newCategoryDescription}
                            onChange={e => setNewCategoryDescription(e.target.value)}
                            className="add-category-input" 
                            placeholder="Mô tả (tùy chọn)"
                            disabled={isLoading}
                        />
                        <button type="submit" className="add-category-btn" disabled={isLoading}>
                            <i className="fas fa-plus"></i> {isLoading ? 'Đang thêm...' : 'Thêm'}
                        </button>
                    </form>
                
                    <hr />
                
                    <h3>Danh sách danh mục hiện có</h3>
                    {isLoading && categories.length === 0 && <p>Đang tải danh mục...</p>}
                    
                    <div className="categories-list">
                        {categories.length > 0 ? categories.map(cat => (
                            <div className="category-item" data-id={cat.id_loai} key={cat.id_loai}>
                                <div className="category-info">
                                    <span className="category-name">{cat.ten}</span>
                                    {cat.mota && <small className="category-description">{cat.mota}</small>}
                                </div>
                                <div className="category-meta">
                                    <span className="category-count">({cat.so_luong_san_pham || 0} sản phẩm)</span>
                                    <div className="category-actions">
                                        <button 
                                            className="category-btn edit-btn" 
                                            title="Sửa" 
                                            onClick={() => openEditModal(cat)}
                                            disabled={isLoading}
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button 
                                            className="category-btn delete-btn" 
                                            title="Xóa"
                                            onClick={() => handleDeleteCategory(cat.id_loai, cat.ten)}
                                            disabled={isLoading}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            !isLoading && <p>Chưa có danh mục nào.</p>
                        )}
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="modal-btn cancel-btn" onClick={onClose}>Đóng</button>
                </div>
            </div>

            {/* Sub-modal for editing category */}
            {isEditModalVisible && editingCategory && (
                <div className="modal-overlay active" onClick={closeEditModal} style={{zIndex: 1101}}> {/* z-index cao hơn */}
                    <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Sửa Danh mục</h2>
                            <button type="button" className="close-modal-btn" onClick={closeEditModal}>×</button>
                        </div>
                        <form onSubmit={handleEditCategory}>
                            <div className="modal-body">
                                {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
                                <input type="hidden" value={editingCategory.id_loai} />
                                <div className="form-group">
                                    <label htmlFor="editCategoryNameInputModal" className="form-label">Tên danh mục</label>
                                    <input 
                                        type="text" 
                                        id="editCategoryNameInputModal" 
                                        className="form-input" // Dùng class form-input chung
                                        value={editCategoryName}
                                        onChange={e => setEditCategoryName(e.target.value)}
                                        required 
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="editCategoryDescriptionInputModal" className="form-label">Mô tả</label>
                                    <textarea 
                                        id="editCategoryDescriptionInputModal" 
                                        className="form-textarea" // Dùng class form-textarea chung
                                        value={editCategoryDescription}
                                        onChange={e => setEditCategoryDescription(e.target.value)}
                                        disabled={isLoading}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="modal-btn cancel-btn" onClick={closeEditModal} disabled={isLoading}>Hủy</button>
                                <button type="submit" className="modal-btn save-btn" disabled={isLoading}>
                                    {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CategoryManagementModal;