import { API_BASE_URL } from '@/constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

class JournalApi {
  constructor() {
    this.baseURL = `${API_BASE_URL}/journal`;
  }

  // Get auth token from storage
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Get auth headers
  async getAuthHeaders() {
    const token = await this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // Create a new journal entry
  async createJournal(entryData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(entryData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create journal entry');
      }

      return data;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  }

  // Get all journal entries with optional filters
  async getAllJournals(filters = {}) {
    try {
      const headers = await this.getAuthHeaders();
      const queryParams = new URLSearchParams();
      
      if (filters.mood) queryParams.append('mood', filters.mood);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.sort) queryParams.append('sort', filters.sort);

      const url = `${this.baseURL}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch journal entries');
      }

      return data;
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      throw error;
    }
  }

  // Get journal entry by ID
  async getJournalById(id) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch journal entry');
      }

      return data;
    } catch (error) {
      console.error('Error fetching journal entry:', error);
      throw error;
    }
  }

  // Get journal entries by author
  async getJournalsByAuthor(authorId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/author/${authorId}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch journal entries by author');
      }

      return data;
    } catch (error) {
      console.error('Error fetching journal entries by author:', error);
      throw error;
    }
  }

  // Update journal entry
  async updateJournal(id, updateData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update journal entry');
      }

      return data;
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw error;
    }
  }

  // Delete journal entry
  async deleteJournal(id) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete journal entry');
      }

      return data;
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  }

  // Toggle favorite status
  async toggleFavorite(id) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/${id}/favorite`, {
        method: 'PATCH',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle favorite status');
      }

      return data;
    } catch (error) {
      console.error('Error toggling favorite status:', error);
      throw error;
    }
  }
}

export default new JournalApi(); 