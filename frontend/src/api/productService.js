// frontend/src/api/productService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/admin/products'; 

export const getAllProductsAPI = async () => {
    try {
        const response = await axios.get(API_BASE_URL);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi gọi API lấy tất cả sản phẩm:", error.response ? error.response.data : error.message);
        // Ném lại lỗi để component gọi có thể xử lý
        throw error.response ? error.response.data : new Error(error.message);
    }
};

export const getProductByIdAPI = async (productId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${productId}`);
        return response.data;
    } catch (error) {
        console.error(`Lỗi khi gọi API lấy sản phẩm ID ${productId}:`, error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error(error.message);
    }
};

export const createProductAPI = async (formData) => {
    try {
        const response = await axios.post(API_BASE_URL, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi gọi API tạo sản phẩm:", error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error(error.message);
    }
};

// Hàm cập nhật sản phẩm
export const updateProductAPI = async (productId, formData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/${productId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error(`Lỗi khi gọi API cập nhật sản phẩm ID ${productId}:`, error.response ? error.response.data : error.message);
        // Ném lại lỗi để component gọi có thể xử lý và hiển thị thông báo lỗi từ backend
        throw error.response ? error.response.data : new Error(error.message);
    }
};

// Hàm xóa sản phẩm
export const deleteProductAPI = async (productId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/${productId}`);
        return response.data;
    } catch (error) {
        console.error(`Lỗi khi gọi API xóa sản phẩm ID ${productId}:`, error.response ? error.response.data : error.message);
        // Ném lại lỗi để component gọi có thể xử lý và hiển thị thông báo lỗi từ backend
        throw error.response ? error.response.data : new Error(error.message);
    }
};