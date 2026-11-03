// Debug the environment variable loading
console.log('Environment check:', {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NODE_ENV: process.env.NODE_ENV,
  all_env: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC'))
})

// Backend base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000'

console.log('API URL Debug:', {
  from_env: process.env.NEXT_PUBLIC_API_URL,
  final_url: API_BASE_URL
})

// Token management functions
export const setTokens = (accessToken: string | null, refreshToken: string | null) => {
  if (typeof window !== 'undefined') {
    if (accessToken) {
      localStorage.setItem('access_token', accessToken)
    } else {
      localStorage.removeItem('access_token')
    }
    
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken)
    } else {
      localStorage.removeItem('refresh_token')
    }
  }
}

export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

export const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refresh_token')
  }
  return null
}

export const clearTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Use configured base URL
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Making request to: ${url}`);
    
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined)
    }
    // Attach JWT if present
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')
      if (token) headers['Authorization'] = `Bearer ${token}`
    }
    // Avoid sending Content-Type on GET to prevent unnecessary preflight
    if ((options.method || 'GET').toUpperCase() !== 'GET') {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json'
    }

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch(url, {
        ...options,
        headers,
        mode: 'cors',
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      console.log(`Response: ${response.status} from ${response.url}`);

      if (!response.ok) {
        let errorData: any = null
        try {
          errorData = await response.json()
        } catch {}

        if (response.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }

        const errorMessage = errorData?.message || errorData?.error || errorData?.msg || `HTTP ${response.status}`
        const error = new Error(errorMessage)
        ;(error as any).status = response.status
        ;(error as any).data = errorData
        throw error
      }

      const data = await response.json();
      console.log(`Data received:`, data);
      return data;
    } catch (error) {
      const status = (error as any)?.status

      if (status === 401 || status === 403) {
        console.warn(`Auth ${status} for ${url}:`, (error as any)?.message)
        throw error
      }

      if (status) {
        console.warn(`Request failed with status ${status} for ${url}:`, (error as any)?.message)
        throw error
      }

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const netErr = new Error(`Cannot connect to backend. Please check if the backend server is running on ${API_BASE_URL}`)
        ;(netErr as any).status = 0
        throw netErr
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutErr = new Error(`Request timeout. Backend may be slow or unavailable.`)
        ;(timeoutErr as any).status = 408
        throw timeoutErr
      }
      
      const message = error instanceof Error ? error.message : String(error)
      const genericErr = new Error(`Cannot connect to backend at ${url}. Error: ${message}`)
      ;(genericErr as any).status = (error as any)?.status
      throw genericErr
    }
  }

  private async requestWithTimeout<T>(endpoint: string, options: RequestInit = {}, timeoutMs: number): Promise<T> {
    // Use configured base URL
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Making request to: ${url} (timeout: ${timeoutMs}ms)`);
    
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined)
    }
    // Attach JWT if present
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')
      if (token) headers['Authorization'] = `Bearer ${token}`
    }
    // Avoid sending Content-Type on GET to prevent unnecessary preflight
    if ((options.method || 'GET').toUpperCase() !== 'GET') {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json'
    }

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
      
      const response = await fetch(url, {
        ...options,
        headers,
        mode: 'cors',
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      console.log(`Response: ${response.status} from ${response.url}`);

      if (!response.ok) {
        let errorData: any = null
        try {
          errorData = await response.json()
        } catch {}

        if (response.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }

        const errorMessage = errorData?.message || errorData?.error || errorData?.msg || `HTTP ${response.status}`
        const error = new Error(errorMessage)
        ;(error as any).status = response.status
        ;(error as any).data = errorData
        throw error
      }

      const data = await response.json();
      console.log(`Data received:`, data);
      return data;
    } catch (error) {
      const status = (error as any)?.status

      if (status === 401 || status === 403) {
        console.warn(`Auth ${status} for ${url}:`, (error as any)?.message)
        throw error
      }

      if (status) {
        console.warn(`Request failed with status ${status} for ${url}:`, (error as any)?.message)
        throw error
      }

      // Handle different types of errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const netErr = new Error(`Cannot connect to backend. Please check if the backend server is running on ${API_BASE_URL}`)
        ;(netErr as any).status = 0
        throw netErr
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutErr = new Error(`Request timeout after ${timeoutMs/1000}s. Backend may be slow or unavailable.`)
        ;(timeoutErr as any).status = 408
        throw timeoutErr
      }
      
      const message = error instanceof Error ? error.message : String(error)
      const genericErr = new Error(`Cannot connect to backend at ${url}. Error: ${message}`)
      ;(genericErr as any).status = (error as any)?.status
      throw genericErr
    }
  }

  // Generic HTTP methods
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async healthCheck() {
    return this.request('/api/health')
  }

  async healthCheckWithRetry(maxRetries: number = 3, delay: number = 2000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await this.healthCheck()
        return result
      } catch (error) {
        console.log(`Health check attempt ${i + 1}/${maxRetries} failed`)
        
        if (i === maxRetries - 1) {
          throw error // Last attempt, throw the error
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // Auth endpoints
  async signUp(email: string, password: string, username: string, role: string = 'Analyst') {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username, role })
    })
  }

  async signIn(email: string, password: string) {
    return this.request('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }
  
  // OAuth: start Google login
  getGoogleLoginUrl() {
    // Using server redirect flow
    return `${API_BASE_URL}/api/auth/google/login`
  }

  async getProfile() {
    return this.request('/api/auth/profile')
  }

  // Dashboard endpoints
  async getDashboardInfo() {
    return this.request('/api/dashboard')
  }

  async getSources(params?: any) {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/api/sources${query}`)
  }

  async getUsers(params?: any) {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/api/users${query}`)
  }

  async getContent(params?: any) {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/api/content${query}`)
  }

  async getCases(status?: string) {
    const query = status ? `?status=${status}` : ''
    return this.request(`/api/cases${query}`)
  }

  // Active case session endpoints
  async getActiveCase() {
    return this.request('/api/cases/active')
  }

  async setActiveCase(caseId: number) {
    return this.request('/api/cases/active', {
      method: 'POST',
      body: JSON.stringify({ case_id: caseId })
    })
  }

  async clearActiveCase() {
    return this.request('/api/cases/active', { method: 'DELETE' })
  }

  async getCase(caseId: number) {
    return this.request(`/api/cases/${caseId}`)
  }

  async createCase(caseData: any) {
    return this.request('/api/cases', {
      method: 'POST',
      body: JSON.stringify(caseData)
    })
  }

  async linkContentToCase(caseId: number, contentIds: number[]) {
    return this.request(`/api/cases/${caseId}/content`, {
      method: 'POST',
      body: JSON.stringify({ content_ids: contentIds })
    })
  }

  async unlinkContentFromCase(caseId: number, contentId: number) {
    return this.request(`/api/cases/${caseId}/content/${contentId}`, {
      method: 'DELETE'
    })
  }

  async canCreateCase() {
    return this.request('/api/cases/can-create')
  }

  async closeCase(caseId: number, notes?: string) {
    return this.request(`/api/cases/${caseId}/close`, {
      method: 'PUT',
      body: JSON.stringify({ notes: notes || '' })
    })
  }

  async archiveCase(caseId: number, notes?: string) {
    return this.request(`/api/cases/${caseId}/archive`, {
      method: 'PUT',
      body: JSON.stringify({ notes: notes || '' })
    })
  }

  // Case Request endpoints
  async getCaseRequests(status?: string) {
    const params = status ? `?status=${status}` : ''
    return this.request(`/api/cases/requests${params}`)
  }

  async approveCaseRequest(requestId: number, reviewNotes?: string) {
    return this.request(`/api/cases/requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ review_notes: reviewNotes })
    })
  }

  async rejectCaseRequest(requestId: number, reviewNotes: string) {
    return this.request(`/api/cases/requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ review_notes: reviewNotes })
    })
  }

  async getHighRiskContent() {
    // TODO: Implement high-risk content endpoint later
    // return this.request('/api/content/high-risk')
    return { status: 'success', data: [] }
  }

  // Scraping endpoints
  async getScrapingStats() {
    return this.request('/api/scraping/stats')
  }

  async getScrapingJobs() {
    return this.request('/api/scraping/jobs')
  }

  async getScrapedContent(params?: { limit?: number | string }) {
    const rawLimit = params?.limit
    const limit = typeof rawLimit === 'string' ? parseInt(rawLimit, 10) : rawLimit
    const query = typeof limit === 'number' && !Number.isNaN(limit) ? `?limit=${limit}` : ''
    return this.request(`/api/scraping/content${query}`)
  }

  async getContentAnalysisScrapedContent(params?: { limit?: number | string }) {
    const rawLimit = params?.limit
    const limit = typeof rawLimit === 'string' ? parseInt(rawLimit, 10) : rawLimit
    const query = typeof limit === 'number' && !Number.isNaN(limit) ? `?limit=${limit}` : ''
    return this.request(`/api/content-analysis/scraped-content${query}`)
  }

  // Alias for backwards compatibility
  async getRecentScrapedContent(arg?: number | { limit?: number | string }) {
    const limit = typeof arg === 'number' ? arg : (arg?.limit ?? 10)
    return this.getScrapedContent({ limit })
  }

  async createScrapingJob(jobData: any) {
    return this.request('/api/scraping/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData)
    })
  }

  async runScrapingJob(jobId: string) {
    return this.request(`/api/scraping/jobs/${jobId}/run`, {
      method: 'POST'
    })
  }

  // Real scraping endpoints
  async scrapeTelegramChannel(channel: string, limit: number = 10, keywords: string[] = []) {
    return this.request('/api/scraping/telegram/scrape', {
      method: 'POST',
      body: JSON.stringify({ channel, limit, keywords })
    })
  }

  async getTelegramChannels() {
    return this.request('/api/scraping/telegram/channels')
  }

  // Admin endpoints
  async getSystemUsers() {
    return this.request('/api/admin/users')
  }

  async toggleSystemUserActive(userId: string) {
    return this.request(`/api/admin/users/${userId}/toggle-active`, {
      method: 'POST'
    })
  }

  // OSINT endpoints
  async getOsintToolsStatus() {
    return this.request('/api/osint/tools/status')
  }

  async investigateUser(username: string, platform: string) {
    return this.requestWithTimeout('/api/osint/investigate-user', {
      method: 'POST',
      body: JSON.stringify({ username, platform })
    }, 300000) // 5 minute timeout for investigation (OSINT tools can be slow)
  }

  // Data Management endpoints
  async getDataStats() {
    return this.request('/api/admin/data/stats')
  }

  async getPlatformUsers() {
    return this.request('/api/admin/data/platform-users')
  }

  async getAdminSources() {
    return this.request('/api/admin/sources')
  }

  async createSource(sourceData: any) {
    return this.request('/api/admin/sources', {
      method: 'POST',
      body: JSON.stringify(sourceData)
    })
  }

  async toggleSource(sourceId: string) {
    return this.request(`/api/admin/sources/${sourceId}/toggle`, {
      method: 'POST'
    })
  }

  async deleteSource(sourceId: string) {
    return this.request(`/api/admin/sources/${sourceId}`, {
      method: 'DELETE'
    })
  }

  async deleteContentItem(contentId: string) {
    return this.request(`/api/admin/content/${contentId}`, {
      method: 'DELETE'
    })
  }

  async getAdminStats() {
    return this.request('/api/admin/stats')
  }

  async getAdminActivity() {
    return this.request('/api/admin/activity')
  }

  async getApiStatus() {
    return this.request('/api/admin/api-status')
  }

  async getOSINTInfo() {
    return this.request('/api/osint/tools/status')
  }

  async getKeywords() {
    return this.request('/api/admin/keywords')
  }

  async createKeyword(keywordData: any) {
    return this.request('/api/admin/keywords', {
      method: 'POST',
      body: JSON.stringify(keywordData)
    })
  }

  async toggleKeyword(keywordId: string) {
    return this.request(`/api/admin/keywords/${keywordId}/toggle`, {
      method: 'POST'
    })
  }

  async deleteKeyword(keywordId: string) {
    return this.request(`/api/admin/keywords/${keywordId}`, {
      method: 'DELETE'
    })
  }

  async getContentData() {
    return this.request('/api/admin/data/content')
  }

  async getCasesData() {
    return this.request('/api/admin/data/cases')
  }

  async toggleUserFlag(userId: string) {
    return this.request(`/api/admin/data/platform-users/${userId}/flag`, {
      method: 'POST'
    })
  }

  async exportData(dataType: string) {
    return this.request(`/api/admin/data/export/${dataType}`)
  }

  // Scraping Management endpoints
  async controlScrapingJob(jobId: string, action: string) {
    return this.request(`/api/scraping/jobs/${jobId}/control`, {
      method: 'POST',
      body: JSON.stringify({ action })
    })
  }

  async toggleScrapingJob(jobId: string) {
    return this.request(`/api/scraping/jobs/${jobId}/toggle`, {
      method: 'POST'
    })
  }

  async runScrapingJobNow(jobId: string) {
    return this.request(`/api/scraping/jobs/${jobId}/run`, {
      method: 'POST'
    })
  }

  async exportScrapingData(dataType: string) {
    return this.request(`/api/scraping/export/${dataType}`)
  }

  // Delete scraped content methods
  async deleteScrapedContent(contentId: string) {
    return this.request(`/api/scraping/content/${contentId}`, {
      method: 'DELETE'
    })
  }

  async deleteMultipleScrapedContent(contentIds: string[]) {
    return this.request('/api/scraping/content/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ content_ids: contentIds })
    })
  }

  async deleteScrapedContentBySource(sourceId: string) {
    return this.request(`/api/scraping/content/source/${sourceId}`, {
      method: 'DELETE'
    })
  }

  async deleteScrapedContentByDateRange(startDate: string, endDate: string) {
    return this.request('/api/scraping/content/date-range', {
      method: 'DELETE',
      body: JSON.stringify({ start_date: startDate, end_date: endDate })
    })
  }

  async deleteAllScrapedContent() {
    return this.request('/api/scraping/content/all', {
      method: 'DELETE'
    })
  }

  async cleanupScrapedContent(options?: {
    days_old?: number;
    keep_flagged?: boolean;
    keep_recent?: number;
  }) {
    return this.request('/api/scraping/content/cleanup', {
      method: 'POST',
      body: JSON.stringify(options || {})
    })
  }

  // Platform-specific scraping endpoints
  async getInstagramProfiles() {
    return this.request('/api/scraping/instagram/profiles')
  }

  async scrapeInstagramProfile(username: string, maxPosts: number = 20) {
    return this.request('/api/scraping/instagram/scrape', {
      method: 'POST',
      body: JSON.stringify({ username, max_posts: maxPosts })
    })
  }

  async getWhatsAppGroups() {
    return this.request('/api/scraping/whatsapp/groups')
  }

  async getScrapingHealthCheck() {
    return this.request('/api/scraping/health-check')
  }

  // Reports endpoints
  async getCasesForReports(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    priority?: string;
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.priority) queryParams.append('priority', params.priority)
    
    const queryString = queryParams.toString()
    return this.request(`/api/reports/list${queryString ? `?${queryString}` : ''}`)
  }

  async generateCaseReport(caseId: number) {
    return this.request(`/api/reports/${caseId}/generate`, {
      method: 'GET'
    })
  }

  async previewCaseReport(caseId: number) {
    return this.request(`/api/reports/${caseId}/preview`)
  }

  async getReportsHealthCheck() {
    return this.request('/api/reports/health')
  }

  async previewActiveCaseReport() {
    return this.request('/api/reports/active/preview')
  }

  // Case Activities endpoints
  async getCaseActivities(caseId: number, params?: {
    type?: string;
    include_in_report?: boolean;
    analyst_id?: number;
  }) {
    const queryParams = new URLSearchParams()
    if (params?.type) queryParams.append('type', params.type)
    if (params?.include_in_report !== undefined) queryParams.append('include_in_report', params.include_in_report.toString())
    if (params?.analyst_id) queryParams.append('analyst_id', params.analyst_id.toString())
    
    const queryString = queryParams.toString()
    return this.request(`/api/cases/${caseId}/activities${queryString ? `?${queryString}` : ''}`)
  }

  async createCaseActivity(caseId: number, activityData: {
    title: string;
    description: string;
    activity_type?: string;
    status?: string;
    tags?: string[];
    priority?: string;
    activity_date?: string;
    time_spent_minutes?: number;
    include_in_report?: boolean;
    is_confidential?: boolean;
    visibility_level?: string;
    related_content_ids?: number[];
    related_source_ids?: number[];
    attachments?: any[];
    evidence_links?: any[];
  }) {
    return this.request(`/api/cases/${caseId}/activities`, {
      method: 'POST',
      body: JSON.stringify(activityData)
    })
  }

  async getCaseActivity(caseId: number, activityId: number) {
    return this.request(`/api/cases/${caseId}/activities/${activityId}`)
  }

  async updateCaseActivity(caseId: number, activityId: number, activityData: any) {
    return this.request(`/api/cases/${caseId}/activities/${activityId}`, {
      method: 'PUT',
      body: JSON.stringify(activityData)
    })
  }

  async deleteCaseActivity(caseId: number, activityId: number) {
    return this.request(`/api/cases/${caseId}/activities/${activityId}`, {
      method: 'DELETE'
    })
  }

  async toggleActivityReportInclusion(caseId: number, activityId: number) {
    return this.request(`/api/cases/${caseId}/activities/${activityId}/toggle-report`, {
      method: 'POST'
    })
  }

  async getCaseActivitiesSummary(caseId: number) {
    return this.request(`/api/cases/${caseId}/activities/summary`)
  }

  async generateDetailedCaseReport(caseId: number, params?: {
    include_activities?: boolean;
    include_content?: boolean;
  }) {
    const queryParams = new URLSearchParams()
    if (params?.include_activities !== undefined) queryParams.append('include_activities', params.include_activities.toString())
    if (params?.include_content !== undefined) queryParams.append('include_content', params.include_content.toString())
    
    const queryString = queryParams.toString()
    const url = `${API_BASE_URL}/api/reports/${caseId}/generate-detailed${queryString ? `?${queryString}` : ''}`
    
    // Get token
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    
    const response = await fetch(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to generate report: ${response.status}`)
    }
    
    return response.blob()
  }
}

export const apiClient = new ApiClient()
export default apiClient









