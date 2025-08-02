import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'  // CORRIGÉ: 3001 au lieu de 3000

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Intercepteur pour ajouter le token JWT
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })
  }

  // Trading endpoints
  async createOrder(orderData) {
    try {
      const response = await this.client.post('/trading/order', orderData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getMyOrders() {
    try {
      const response = await this.client.get('/trading/orders')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getOrderBook(pair) {
    try {
      const response = await this.client.get(`/trading/orderbook/${encodeURIComponent(pair)}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async cancelOrder(orderId) {
    try {
      const response = await this.client.delete(`/trading/order/${orderId}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getTradingStats() {
    try {
      const response = await this.client.get('/trading/stats')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getMyTrades() {
    try {
      const response = await this.client.get('/trading/trades')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // 💰 Portfolio endpoints
  async getPortfolioBalances() {
    try {
      const response = await this.client.get('/portfolio/balances')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getPortfolioSummary() {
    try {
      const response = await this.client.get('/portfolio/summary')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getPortfolioPerformance() {
    try {
      const response = await this.client.get('/portfolio/performance')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Auth endpoints
  async login(address) {
    try {
      const response = await this.client.post('/auth/login', { address })
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token)
      }
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getProfile() {
    try {
      const response = await this.client.get('/auth/me')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Gestion des erreurs
  handleError(error) {
    if (error.response) {
      return new Error(error.response.data.message || error.response.data.error || 'Erreur API')
    } else if (error.request) {
      return new Error('Impossible de contacter le serveur')
    } else {
      return new Error(error.message || 'Erreur inconnue')
    }
  }

  // Test de connexion
  async testConnection() {
    try {
      const response = await this.client.get('/status')
      return response.data
    } catch (error) {
      return null
    }
  }
}

export const apiService = new ApiService()
export default apiService
