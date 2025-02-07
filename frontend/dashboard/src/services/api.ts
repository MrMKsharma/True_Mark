import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const productService = {
  async getProducts(): Promise<ProductData[]> {
    try {
      const response = await api.get('/products');
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  async addProduct(product: Omit<ProductData, 'id' | 'dateRegistered' | 'status'>): Promise<ProductData | null> {
    try {
      const response = await api.post('/products', product);
      return response.data;
    } catch (error) {
      console.error('Error adding product:', error);
      return null;
    }
  },
};

export const reportService = {
  async getReports(): Promise<CounterfeitReport[]> {
    try {
      const response = await api.get('/reports');
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  },

  async addReport(report: Omit<CounterfeitReport, 'id' | 'reportDate' | 'status'>): Promise<CounterfeitReport | null> {
    try {
      const response = await api.post('/reports', report);
      return response.data;
    } catch (error) {
      console.error('Error adding report:', error);
      return null;
    }
  },
};

export default api;
