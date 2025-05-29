// src/components/common/GeneralModal.js
import React from 'react';
import './GeneralModal.css'; // Tạo file CSS này bên cạnh

function GeneralModal({ 
    isOpen, 
    onClose, 
    title, 
    children, // Nội dung chính của modal sẽ được truyền vào đây
    footerContent, // JSX cho phần footer (ví dụ: các nút bấm)
    maxWidth = '800px' // Kích thước tối đa mặc định của modal
}) {
    if (!isOpen) {
        return null;
    }

    const handleOverlayClick = (e) => {
        // Chỉ đóng modal nếu click trực tiếp vào overlay, không phải vào nội dung modal
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay active" onClick={handleOverlayClick}>
            <div className="modal" style={{ maxWidth: maxWidth }} onClick={e => e.stopPropagation()}>
                {title && ( // Chỉ render header nếu có title
                    <div className="modal-header">
                        <h2 className="modal-title">{title}</h2>
                        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
                            × {/* Ký tự X */}
                        </button>
                    </div>
                )}
                <div className="modal-body">
                    {children}
                </div>
                {footerContent && (
                    <div className="modal-footer">
                        {footerContent}
                    </div>
                )}
            </div>
        </div>
    );
}

export default GeneralModal;