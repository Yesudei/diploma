import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  TokenRefreshResponse,
  AudioFile,
  AudioUploadResponse,
  MixingAnalysisResult,
  MelodyGenerationRequest,
  MelodyGeneration,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  MarketplaceListing,
  MarketplaceCategory,
  PaginatedResponse,
  PaginationParams,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
} from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
const API_TIMEOUT =
  parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10);

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class ApiService {
  private static instance: ApiService;
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: AxiosError) => void;
  }> = [];

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private setupInterceptors(): void {
    // Request interceptor to add token
    this.axiosInstance.interceptors.request.use(
      (config: ExtendedAxiosRequestConfig) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for token refresh
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;

        // Don't retry refresh token requests
        if (originalRequest?.url?.includes('/auth/refresh')) {
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.axiosInstance(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken =
              typeof window !== 'undefined'
                ? localStorage.getItem('refresh_token')
                : null;

            if (!refreshToken) {
              this.clearTokens();
              if (typeof window !== 'undefined') {
                window.location.href = '/auth/login';
              }
              return Promise.reject(error);
            }

            const response = await this.axiosInstance.post<TokenRefreshResponse>(
              '/auth/refresh',
              { refresh_token: refreshToken }
            );

            const { access_token, refresh_token } = response.data;

            if (typeof window !== 'undefined') {
              localStorage.setItem('access_token', access_token);
              if (refresh_token) {
                localStorage.setItem('refresh_token', refresh_token);
              }
            }

            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            this.failedQueue.forEach(({ resolve }) => resolve(access_token));
            this.failedQueue = [];

            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            this.failedQueue = [];
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.axiosInstance.post<AuthResponse>(
      '/auth/login',
      credentials
    );
    return response.data;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await this.axiosInstance.post<AuthResponse>(
      '/auth/register',
      credentials
    );
    return response.data;
  }

  async logout(): Promise<void> {
    this.clearTokens();
  }

  async refreshToken(refreshToken: string): Promise<TokenRefreshResponse> {
    const response = await this.axiosInstance.post<TokenRefreshResponse>(
      '/auth/refresh',
      { refresh_token: refreshToken }
    );
    return response.data;
  }

  // User endpoints
  async getCurrentUser(): Promise<User> {
    const response = await this.axiosInstance.get<User>('/users/me');
    return response.data;
  }

  async updateProfile(
    data: ProfileUpdateRequest
  ): Promise<ProfileUpdateResponse> {
    const formData = new FormData();

    if (data.username) {
      formData.append('username', data.username);
    }
    if (data.bio) {
      formData.append('bio', data.bio);
    }
    if (data.profile_picture) {
      formData.append('profile_picture', data.profile_picture);
    }

    const response = await this.axiosInstance.put<ProfileUpdateResponse>(
      '/users/profile',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  // Audio File endpoints
  async uploadAudio(file: File): Promise<AudioUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.axiosInstance.post<AudioUploadResponse>(
      '/audio/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async listAudioFiles(
    params?: PaginationParams
  ): Promise<PaginatedResponse<AudioFile>> {
    const response = await this.axiosInstance.get<
      PaginatedResponse<AudioFile>
    >('/audio/files', { params });
    return response.data;
  }

  async getAudioFile(id: string): Promise<AudioFile> {
    const response = await this.axiosInstance.get<AudioFile>(
      `/audio/files/${id}`
    );
    return response.data;
  }

  async deleteAudioFile(id: string): Promise<{ message: string }> {
    const response = await this.axiosInstance.delete<{ message: string }>(
      `/audio/files/${id}`
    );
    return response.data;
  }

  // Analysis endpoints
  async analyzeAudio(audioFileId: string): Promise<MixingAnalysisResult> {
    const response = await this.axiosInstance.post<MixingAnalysisResult>(
      `/analysis/analyze`,
      { audio_file_id: audioFileId }
    );
    return response.data;
  }

  async listAnalysisResults(
    params?: PaginationParams
  ): Promise<PaginatedResponse<MixingAnalysisResult>> {
    const response = await this.axiosInstance.get<
      PaginatedResponse<MixingAnalysisResult>
    >('/analysis/results', { params });
    return response.data;
  }

  async getAnalysisResult(id: string): Promise<MixingAnalysisResult> {
    const response = await this.axiosInstance.get<MixingAnalysisResult>(
      `/analysis/results/${id}`
    );
    return response.data;
  }

  async deleteAnalysisResult(id: string): Promise<{ message: string }> {
    const response = await this.axiosInstance.delete<{ message: string }>(
      `/analysis/results/${id}`
    );
    return response.data;
  }

  // Melody Generation endpoints
  async generateMelody(
    request: MelodyGenerationRequest
  ): Promise<MelodyGeneration> {
    const response = await this.axiosInstance.post<MelodyGeneration>(
      '/generation/melody',
      request
    );
    return response.data;
  }

  async listMelodyGenerations(
    params?: PaginationParams
  ): Promise<PaginatedResponse<MelodyGeneration>> {
    const response = await this.axiosInstance.get<
      PaginatedResponse<MelodyGeneration>
    >('/generation/melody', { params });
    return response.data;
  }

  async getMelodyGeneration(id: string): Promise<MelodyGeneration> {
    const response = await this.axiosInstance.get<MelodyGeneration>(
      `/generation/melody/${id}`
    );
    return response.data;
  }

  async deleteMelodyGeneration(id: string): Promise<{ message: string }> {
    const response = await this.axiosInstance.delete<{ message: string }>(
      `/generation/melody/${id}`
    );
    return response.data;
  }

  // Chat endpoints
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.axiosInstance.post<ChatResponse>(
      '/chat/messages',
      request
    );
    return response.data;
  }

  async listChatMessages(
    params?: PaginationParams
  ): Promise<PaginatedResponse<ChatMessage>> {
    const response = await this.axiosInstance.get<
      PaginatedResponse<ChatMessage>
    >('/chat/messages', { params });
    return response.data;
  }

  async deleteChatMessage(id: string): Promise<{ message: string }> {
    const response = await this.axiosInstance.delete<{ message: string }>(
      `/chat/messages/${id}`
    );
    return response.data;
  }

  // Marketplace endpoints
  async listMarketplaceListings(
    params?: PaginationParams & { category?: string }
  ): Promise<PaginatedResponse<MarketplaceListing>> {
    const response = await this.axiosInstance.get<
      PaginatedResponse<MarketplaceListing>
    >('/marketplace/listings', { params });
    return response.data;
  }

  async getMarketplaceListing(id: string): Promise<MarketplaceListing> {
    const response = await this.axiosInstance.get<MarketplaceListing>(
      `/marketplace/listings/${id}`
    );
    return response.data;
  }

  async listMarketplaceCategories(): Promise<MarketplaceCategory[]> {
    const response = await this.axiosInstance.get<MarketplaceCategory[]>(
      '/marketplace/categories'
    );
    return response.data;
  }

  async searchMarketplace(
    query: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<MarketplaceListing>> {
    const response = await this.axiosInstance.get<
      PaginatedResponse<MarketplaceListing>
    >('/marketplace/search', {
      params: { q: query, ...params },
    });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await this.axiosInstance.get<{ status: string }>(
      '/health'
    );
    return response.data;
  }

  // Helper to extract error message safely without using any
  static getErrorMessage(error: unknown): string {
    if (error instanceof AxiosError && error.response) {
      const data = error.response.data;
      if (
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof (data as { message: unknown }).message === 'string'
      ) {
        return (data as { message: string }).message;
      }
    }
    return 'An error occurred';
  }
}

export default ApiService.getInstance();
