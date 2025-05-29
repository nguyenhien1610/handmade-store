// frontend/src/pages/admin/products/ProductListPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Giữ lại Link nếu bạn có dùng ở đâu đó
import ProductCard from '../../../components/products/ProductCard';
// Đảm bảo import deleteProductAPI
import { getAllProductsAPI, deleteProductAPI } from '../../../api/productService'; 
import axios from 'axios'; // Giữ lại nếu dùng cho categories/labels
// Import các Modals
import CategoryManagementModal from '../../../components/admin/categories/CategoryManagementModal';
import LabelManagementModal from '../../../components/admin/labels/LabelManagementModal';
import GeneralModal from '../../../components/common/GeneralModal';
// GIỮ NGUYÊN ĐƯỜNG DẪN IMPORT PRODUCTFORM THEO Ý BẠN:
import ProductForm from '../../../components/admin/products/ProductForm'; 

const API_BASE_URL_CATEGORIES = 'http://localhost:5000/api/admin/categories';
const API_BASE_URL_LABELS = 'http://localhost:5000/api/admin/labels';

import './ProductListPage.css';

function ProductListPage() {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Dùng cho việc tải/lọc sản phẩm
    const [isProcessing, setIsProcessing] = useState(false); // Dùng cho các hành động (xóa,...)
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true); // Dùng cho tải lần đầu
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isLoadingLabels, setIsLoadingLabels] = useState(true);
    const [error, setError] = useState(null);

    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isProductFormModalOpen, setIsProductFormModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const [categoriesForFilter, setCategoriesForFilter] = useState([]);
    const [labelsForForms, setLabelsForForms] = useState([]); // labelsForForms có thể không cần nếu ProductForm tự fetch

    const [selectedFilterCategory, setSelectedFilterCategory] = useState('');
    const [selectedFilterStatus, setSelectedFilterStatus] = useState(''); // Sẽ cần backend hỗ trợ
    const [selectedSortBy, setSelectedSortBy] = useState('newest'); // Sẽ cần backend hỗ trợ
    const [searchTerm, setSearchTerm] = useState(''); // Sẽ cần backend hỗ trợ

    // fetchProducts đã được sửa để gửi params và quản lý isLoading
    const fetchProducts = useCallback(async () => {
        setIsLoading(true); // Bắt đầu tải
        setError(null);
        try {
            // Xây dựng đối tượng params dựa trên state hiện tại
            const params = {};
            if (selectedFilterCategory) params.category = selectedFilterCategory;
            if (selectedFilterStatus) params.status = selectedFilterStatus; // Ví dụ: 'instock', 'outofstock'
            if (selectedSortBy) params.sortBy = selectedSortBy; // Ví dụ: 'price-asc', 'newest'
            if (searchTerm) params.search = searchTerm;

            const productData = await getAllProductsAPI(params); // Gọi API với params
            setProducts(productData || []);
        } catch (err) {
            const errorMessage = err.message || 'Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.';
            setError(errorMessage);
            // console.error("Lỗi tải sản phẩm:", err); // getAllProductsAPI đã log rồi
            setProducts([]); // Đảm bảo products rỗng nếu có lỗi
        } finally {
            setIsLoading(false); // Kết thúc tải
        }
    }, [selectedFilterCategory, selectedFilterStatus, selectedSortBy, searchTerm]);

    const fetchAndUpdateCategoriesForFilter = useCallback(async () => {
        setIsLoadingCategories(true);
        try {
            const categoryResponse = await axios.get(API_BASE_URL_CATEGORIES);
            setCategoriesForFilter(categoryResponse.data || []);
        } catch (err) {
            console.error("Lỗi tải danh mục cho filter:", err);
            setCategoriesForFilter([]);
        } finally {
            setIsLoadingCategories(false);
        }
    }, []);

    const fetchAndUpdateLabelsForForms = useCallback(async () => {
        // Hàm này có thể không cần thiết nếu ProductForm tự fetch labels
        setIsLoadingLabels(true);
        try {
            const labelResponse = await axios.get(API_BASE_URL_LABELS);
            setLabelsForForms(labelResponse.data || []);
        } catch (err) {
            console.error("Lỗi tải danh sách nhãn:", err);
            setLabelsForForms([]);
        } finally {
            setIsLoadingLabels(false);
        }
    }, []);

    useEffect(() => {
        const loadAllInitialData = async () => {
            setIsLoadingInitialData(true);
            setError(null); // Reset error khi tải lại toàn bộ
            await Promise.all([
                fetchProducts(), // fetchProducts sẽ được gọi với params rỗng ban đầu
                fetchAndUpdateCategoriesForFilter(),
                fetchAndUpdateLabelsForForms()
            ]);
            setIsLoadingInitialData(false);
        };
        loadAllInitialData();
    }, []); // Chỉ chạy một lần khi component mount

    // useEffect này sẽ trigger fetchProducts khi các filter thay đổi,
    // nhưng chỉ sau khi tải dữ liệu ban đầu xong.
    useEffect(() => {
        if (!isLoadingInitialData) { // Chỉ fetch khi dữ liệu ban đầu đã tải xong
            fetchProducts();
        }
    }, [selectedFilterCategory, selectedFilterStatus, selectedSortBy, searchTerm, isLoadingInitialData, fetchProducts]);


    const openAddProductModal = () => {
        setEditingProduct(null);
        setIsProductFormModalOpen(true);
    };

    const openEditProductModal = (product) => {
        setEditingProduct(product);
        setIsProductFormModalOpen(true);
    };

    const closeProductFormModal = () => {
        setIsProductFormModalOpen(false);
        setEditingProduct(null); // Quan trọng: reset editingProduct khi đóng modal
    };

    const handleProductFormSuccess = (message, mode, updatedProduct) => {
        // Có thể sử dụng thư viện toast để hiển thị thông báo đẹp hơn
        alert(message); 
        closeProductFormModal();
        fetchProducts(); // Luôn tải lại danh sách để có dữ liệu mới nhất

        // Nếu thêm hoặc sửa, có thể cần cập nhật danh mục/nhãn nếu chúng có thể thay đổi
        if (mode === 'add' || mode === 'edit') {
             fetchAndUpdateCategoriesForFilter(); // Gọi lại nếu danh mục có thể thay đổi
             // fetchAndUpdateLabelsForForms(); // Gọi lại nếu nhãn có thể thay đổi
        }
    };
    
    // ĐÃ SỬA: handleDeleteProduct gọi API
    const handleDeleteProduct = async (productId, productName) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productName}" (ID: ${productId}) không? Hành động này không thể hoàn tác.`)) {
            setIsProcessing(true); // Bắt đầu xử lý
            setError(null);
            try {
                const response = await deleteProductAPI(productId);
                alert(response.message || `Sản phẩm "${productName}" đã được xóa thành công.`);
                fetchProducts(); // Tải lại danh sách sản phẩm sau khi xóa
            } catch (err) {
                const errorMessage = err.message || 'Đã có lỗi xảy ra khi xóa sản phẩm. Vui lòng thử lại.';
                setError(errorMessage); // Set lỗi để có thể hiển thị nếu cần
                alert(errorMessage); // Hiển thị lỗi cho người dùng
                // console.error(`Lỗi khi xóa sản phẩm ID ${productId}:`, err); // deleteProductAPI đã log rồi
            } finally {
                setIsProcessing(false); // Kết thúc xử lý
            }
        }
    };

    // Hiển thị thông báo tải ban đầu
    if (isLoadingInitialData) { 
        return <div className="loading-message" style={{textAlign: 'center', padding: '20px', fontSize: '1.2em'}}>Đang tải dữ liệu khởi tạo...</div>;
    }
    
    // Hiển thị lỗi nghiêm trọng nếu không tải được dữ liệu ban đầu
    if (error && products.length === 0 && categoriesForFilter.length === 0 && !isLoadingInitialData) { 
        return <div className="error-message" style={{textAlign: 'center', padding: '20px', color: 'red'}}>Lỗi: {error}. Vui lòng thử làm mới trang.</div>;
    }

    return (
        <div className="product-list-page-wrapper"> 
            <div className="page-header">
                <div className="page-title-container">
                    <h1 className="page-title">Quản lý sản phẩm</h1>
                    <p className="page-description">Quản lý tất cả sản phẩm của cửa hàng</p>
                </div>
                <div className="page-header-actions">
                    <button className="page-action-btn" onClick={() => setIsLabelModalOpen(true)} disabled={isProcessing}>
                        <i className="fas fa-tags"></i> Quản lý Nhãn
                    </button>
                    <button className="page-action-btn" onClick={() => setIsCategoryModalOpen(true)} disabled={isProcessing}>
                        <i className="fas fa-sitemap"></i> Quản lý Danh mục
                    </button>
                    <button className="add-product-btn" onClick={openAddProductModal} disabled={isProcessing}>
                        <i className="fas fa-plus"></i> Thêm sản phẩm
                    </button>
                </div>
            </div>

            <div className="filter-container">
                <div className="filter-group">
                    <span className="filter-label">DANH MỤC:</span>
                    <select 
                        className="filter-select" 
                        value={selectedFilterCategory}
                        onChange={e => setSelectedFilterCategory(e.target.value)}
                        disabled={isLoadingCategories || isLoading || isProcessing}
                    >
                        <option value="">Tất cả</option>
                        {isLoadingCategories ? (
                            <option disabled>Đang tải danh mục...</option>
                        ) : (
                            categoriesForFilter.map(cat => (
                                <option key={cat.id_loai} value={cat.id_loai}>{cat.ten}</option>
                            ))
                        )}
                    </select>
                </div>
                <div className="filter-group">
                    <span className="filter-label">TRẠNG THÁI:</span>
                    <select 
                        className="filter-select"
                        value={selectedFilterStatus}
                        onChange={e => setSelectedFilterStatus(e.target.value)}
                        disabled={isLoading || isProcessing}
                    >
                        <option value="">Tất cả</option>
                        <option value="instock">Còn hàng</option> 
                        <option value="outofstock">Hết hàng</option> 
                        {/* <option value="onbackorder">Cho phép đặt trước</option> Backend cần hỗ trợ */}
                    </select>
                </div>
                <div className="filter-group">
                    <span className="filter-label">SẮP XẾP:</span>
                    <select 
                        className="filter-select"
                        value={selectedSortBy}
                        onChange={e => setSelectedSortBy(e.target.value)}
                        disabled={isLoading || isProcessing}
                    >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="price-asc">Giá tăng dần</option>
                        <option value="price-desc">Giá giảm dần</option>
                        <option value="name-asc">Tên A-Z</option>
                        <option value="name-desc">Tên Z-A</option>
                    </select>
                </div>
                <div className="search-container">
                    <i className="fas fa-search search-icon"></i>
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Tìm kiếm theo tên, SKU..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        disabled={isLoading || isProcessing}
                    />
                </div>
            </div>

            {/* Thông báo loading riêng cho danh sách sản phẩm */}
            {isLoading && <div className="loading-message" style={{textAlign: 'center', padding: '20px'}}>Đang tải danh sách sản phẩm...</div>}
            {/* Thông báo lỗi cụ thể khi tải sản phẩm (nếu có và không phải lỗi ban đầu) */}
            {error && !isLoading && !isLoadingInitialData && products.length === 0 && <div className="error-message" style={{textAlign: 'center', padding: '20px', color: 'var(--danger-color)'}}>{error}</div>}


            {!isLoading && !isLoadingInitialData && products.length === 0 && !error ? (
                <p className="empty-products-message" style={{textAlign: 'center', padding: '20px'}}>
                    Chưa có sản phẩm nào hoặc không tìm thấy sản phẩm phù hợp với tiêu chí. 
                    <button onClick={openAddProductModal} className="link-like-button" disabled={isProcessing} style={{background: 'none', border: 'none', color: 'var(--info-color)', cursor: 'pointer', textDecoration: 'underline', padding: '0', fontSize: 'inherit'}}> Thêm sản phẩm mới</button>!
                </p>
            ) : (
                !isLoading && products.length > 0 && (
                    <div className="product-grid">
                        {products.map(product => (
                            <ProductCard 
                                key={product.id_sp} 
                                product={product} 
                                // Truyền hàm gọi API xóa vào ProductCard
                                // Hoặc xử lý xóa trực tiếp ở ProductListPage như hiện tại là tốt hơn
                                onDelete={() => handleDeleteProduct(product.id_sp, product.ten)}
                                onEdit={() => openEditProductModal(product)}
                                context="admin"
                                isProcessing={isProcessing} // Truyền trạng thái isProcessing xuống ProductCard để disable nút
                            />
                        ))}
                    </div>
                )
            )}
            
            {/* Pagination (chưa triển khai logic) */}
            {!isLoading && products.length > 0 && (
                <div className="pagination">
                    {/* <button disabled={isProcessing}>Trang trước</button>
                    <span>Trang X / Y</span>
                    <button disabled={isProcessing}>Trang sau</button> */}
                </div>
            )}

            {/* Modal cho ProductForm */}
            <GeneralModal
                isOpen={isProductFormModalOpen}
                onClose={closeProductFormModal}
                title={editingProduct ? `Chỉnh sửa sản phẩm: ${editingProduct.ten}` : "Thêm sản phẩm mới"}
                maxWidth="1000px" // Điều chỉnh kích thước modal nếu cần
            >
                {/* Chỉ render ProductForm khi modal mở để đảm bảo nó nhận initialData mới nhất */}
                {isProductFormModalOpen && ( 
                    <ProductForm
                        // Key đảm bảo form được reset khi thay đổi giữa thêm và sửa, hoặc sửa sản phẩm khác nhau
                        key={editingProduct ? `edit-${editingProduct.id_sp}-${Date.now()}` : `add-new-product-${Date.now()}`} 
                        initialData={editingProduct}
                        isEditMode={!!editingProduct}
                        onFormSubmitSuccess={handleProductFormSuccess}
                        onCancel={closeProductFormModal}
                        // labelsForForm={labelsForForms} // Có thể truyền labels xuống nếu ProductForm không tự fetch
                        // categoriesForForm={categoriesForFilter} // Tương tự cho categories
                    />
                )}
            </GeneralModal>

            {/* Các Modals quản lý Nhãn và Danh mục */}
            <LabelManagementModal
                isOpen={isLabelModalOpen}
                onClose={() => setIsLabelModalOpen(false)}
                onLabelsUpdate={() => {
                    fetchAndUpdateLabelsForForms(); // Cập nhật nhãn cho form nếu cần
                    // fetchProducts(); // Không nhất thiết phải fetch lại products trừ khi nhãn ảnh hưởng trực tiếp đến hiển thị list
                }}
            />
            <CategoryManagementModal 
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onCategoriesUpdate={() => {
                    fetchAndUpdateCategoriesForFilter(); // Cập nhật danh mục cho filter
                    // fetchProducts(); // Có thể fetch lại products nếu thay đổi danh mục ảnh hưởng đến filter hiện tại
                }}
            />
        </div>
    );
}
export default ProductListPage;