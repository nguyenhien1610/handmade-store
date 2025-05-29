// frontend/src/components/admin/labels/LabelManagementModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LabelManagementModal.css'; // Tạo file CSS này

const API_BASE_URL_LABELS = 'http://localhost:5000/api/admin/labels'; // Cổng backend của bạn

function LabelManagementModal({ isOpen, onClose, onLabelsUpdate }) {
    const [labels, setLabels] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // State cho form thêm mới
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelDescription, setNewLabelDescription] = useState('');
    const [newLabelColor, setNewLabelColor] = useState('#ff9aa2'); // Màu mặc định

    // State cho form sửa
    const [editingLabel, setEditingLabel] = useState(null); // { id, ten_nhan, mau_sac_hex, mota_nhan }
    const [editLabelName, setEditLabelName] = useState('');
    const [editLabelDescription, setEditLabelDescription] = useState('');
    const [editLabelColor, setEditLabelColor] = useState('#CCCCCC');
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);

    const fetchLabels = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_BASE_URL_LABELS);
            setLabels(response.data || []);
        } catch (err) {
            setError('Không thể tải danh sách nhãn.');
            console.error("Lỗi tải nhãn trong modal:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLabels();
        }
    }, [isOpen]);

    const handleAddLabel = async (e) => {
        e.preventDefault();
        if (!newLabelName.trim()) {
            alert('Tên nhãn không được để trống.');
            return;
        }
        setIsLoading(true);
        try {
            await axios.post(API_BASE_URL_LABELS, {
                ten_nhan: newLabelName,
                mota_nhan: newLabelDescription,
                mau_sac_hex: newLabelColor,
            });
            await fetchLabels();
            setNewLabelName('');
            setNewLabelDescription('');
            setNewLabelColor('#ff9aa2'); // Reset màu
            if (onLabelsUpdate) onLabelsUpdate();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi thêm nhãn.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteLabel = async (labelId, labelName) => {
        if (window.confirm(`Bạn có chắc muốn xóa nhãn "${labelName}" không?`)) {
            setIsLoading(true);
            try {
                await axios.delete(`${API_BASE_URL_LABELS}/${labelId}`);
                await fetchLabels();
                if (onLabelsUpdate) onLabelsUpdate();
            } catch (err) {
                setError(err.response?.data?.message || 'Lỗi khi xóa nhãn.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const openEditModal = (label) => {
        setEditingLabel(label);
        setEditLabelName(label.ten_nhan);
        setEditLabelDescription(label.mota_nhan || '');
        setEditLabelColor(label.mau_sac_hex || '#CCCCCC');
        setIsEditModalVisible(true);
    };

    const closeEditModal = () => {
        setIsEditModalVisible(false);
        setEditingLabel(null);
    };

    const handleEditLabel = async (e) => {
        e.preventDefault();
        if (!editLabelName.trim() || !editingLabel) return;
        setIsLoading(true);
        try {
            await axios.put(`${API_BASE_URL_LABELS}/${editingLabel.id_nhan}`, {
                ten_nhan: editLabelName,
                mota_nhan: editLabelDescription,
                mau_sac_hex: editLabelColor,
            });
            await fetchLabels();
            closeEditModal();
            if (onLabelsUpdate) onLabelsUpdate();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi cập nhật nhãn.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div className="modal label-management-modal" onClick={e => e.stopPropagation()}> {/* Thêm class riêng */}
                <div className="modal-header">
                    <h2 className="modal-title">Quản lý Nhãn Sản phẩm</h2>
                    <button type="button" className="close-modal-btn" aria-label="Close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
                    <form onSubmit={handleAddLabel} className="add-label-form">
                        <input 
                            type="text" 
                            value={newLabelName}
                            onChange={e => setNewLabelName(e.target.value)}
                            className="form-input" 
                            placeholder="Tên nhãn mới (VD: Hot)" 
                            required 
                            disabled={isLoading}
                        />
                        <input 
                            type="text" 
                            value={newLabelDescription}
                            onChange={e => setNewLabelDescription(e.target.value)}
                            className="form-input" 
                            placeholder="Mô tả (tùy chọn)"
                            disabled={isLoading}
                        />
                        <div className="color-picker-group">
                            <label htmlFor="newLabelColorInput">Màu nhãn:</label>
                            <input 
                                type="color" 
                                id="newLabelColorInput"
                                value={newLabelColor}
                                onChange={e => setNewLabelColor(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <button type="submit" className="add-label-btn" disabled={isLoading}>
                            <i className="fas fa-plus"></i> {isLoading ? 'Đang thêm...' : 'Thêm Nhãn'}
                        </button>
                    </form>
                    <hr />
                    <h3>Danh sách nhãn hiện có</h3>
                    {isLoading && labels.length === 0 && <p>Đang tải danh sách nhãn...</p>}
                    <div className="labels-list">
                        {labels.length > 0 ? labels.map(label => (
                            <div className="label-item" data-id={label.id_nhan} key={label.id_nhan}>
                                <div className="label-info">
                                    <span 
                                        className="label-name-display" 
                                        style={{ backgroundColor: label.mau_sac_hex || '#CCCCCC' }}
                                    >
                                        {label.ten_nhan}
                                    </span>
                                    {label.mota_nhan && <small className="label-description">{label.mota_nhan}</small>}
                                </div>
                                <div className="label-meta">
                                    <span className="label-count">({label.so_luong_san_pham || 0} SP)</span>
                                    <div className="label-actions">
                                        <button 
                                            className="category-btn edit-btn" 
                                            title="Sửa" 
                                            onClick={() => openEditModal(label)}
                                            disabled={isLoading}
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button 
                                            className="category-btn delete-btn" 
                                            title="Xóa"
                                            onClick={() => handleDeleteLabel(label.id_nhan, label.ten_nhan)}
                                            disabled={isLoading}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            !isLoading && <p>Chưa có nhãn nào.</p>
                        )}
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="modal-btn cancel-btn" onClick={onClose}>Đóng</button>
                </div>
            </div>

            {/* Sub-modal for editing label */}
            {isEditModalVisible && editingLabel && (
                <div className="modal-overlay active" onClick={closeEditModal} style={{zIndex: 1101}}>
                    <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Sửa Nhãn</h2>
                            <button type="button" className="close-modal-btn" onClick={closeEditModal}>×</button>
                        </div>
                        <form onSubmit={handleEditLabel}>
                            <div className="modal-body">
                                {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
                                <div className="form-group">
                                    <label htmlFor="editLabelNameInputModal" className="form-label">Tên nhãn</label>
                                    <input type="text" id="editLabelNameInputModal" className="form-input"
                                        value={editLabelName} onChange={e => setEditLabelName(e.target.value)}
                                        required disabled={isLoading} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="editLabelDescriptionInputModal" className="form-label">Mô tả</label>
                                    <textarea id="editLabelDescriptionInputModal" className="form-textarea"
                                        value={editLabelDescription} onChange={e => setEditLabelDescription(e.target.value)}
                                        disabled={isLoading}></textarea>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="editLabelColorInputModal" className="form-label">Màu sắc</label>
                                    <input type="color" id="editLabelColorInputModal" className="form-input" // Có thể dùng class riêng cho input color
                                        style={{height: '40px', padding: '5px'}} // Style trực tiếp cho input color
                                        value={editLabelColor} onChange={e => setEditLabelColor(e.target.value)}
                                        disabled={isLoading}/>
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

export default LabelManagementModal;