import axios from "axios";

//跟後端串起來(API地址)
const API_BASE_URL = "http://127.0.0.1:5000/api";

export const testApi = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/test`);
        console.log("API 回應:", response.data);
        return response.data;
    } catch (error) {
        console.error("API 請求錯誤:", error);
        return null;
    }
};
