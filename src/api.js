import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000";

// 測試 API 連線
export const testApi = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}`);
        console.log("API 回應:", response.data);
        return response.data;
    } catch (error) {
        console.error("API 請求錯誤:", error.response?.data || error.message);
        return null;
    }
};

// 登入函數
export async function login(email, password) {
    try {
        const response = await axios.post(`${API_BASE_URL}/login`, {
            email,
            password,
        });
        return response.data;  // 回傳成功的資料
    } catch (error) {
        console.error("登入失敗:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error || "登入發生錯誤");
    }
}

// 註冊函數
export async function register(email, password) {
    try {
        const response = await axios.post(`${API_BASE_URL}/register`, {
            email,
            password,
        });
        return response.data;  // 回傳成功的資料
    } catch (error) {
        console.error("註冊失敗:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error || "註冊發生錯誤");
    }
}
