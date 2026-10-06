/**
 * LifeLink API Client
 * Automatically attaches JWT authentication headers and handles API responses.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getStoredToken = () => {
  return localStorage.getItem('lifelink_token');
};

export const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem('lifelink_token', token);
  } else {
    localStorage.removeItem('lifelink_token');
  }
};

export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

// API methods
export const api = {
  // Auth
  sendRegistrationOTP: (data) => apiRequest('/auth/send-otp', { method: 'POST', body: JSON.stringify(data) }),
  resendOTP: (data) => apiRequest('/auth/resend-otp', { method: 'POST', body: JSON.stringify(data) }),
  verifyRegistrationOTP: (data) => apiRequest('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  forgotPassword: (data) => apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data) => apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),

  // Donors
  getProfile: () => apiRequest('/donors/profile'),
  updateProfile: (data) => apiRequest('/donors/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getAvailability: () => apiRequest('/donors/availability'),
  updateAvailability: (status) => apiRequest('/donors/availability', { method: 'PUT', body: JSON.stringify({ status }) }),
  getEligibility: () => apiRequest('/donors/eligibility'),

  // Requests
  searchDonors: (data) => apiRequest('/requests/search-donors', { method: 'POST', body: JSON.stringify(data) }),
  createRequest: (data) => apiRequest('/requests', { method: 'POST', body: JSON.stringify(data) }),
  getMyRequests: () => apiRequest('/requests/my'),
  getRequestById: (id) => apiRequest(`/requests/${id}`),
  sendInvitations: (requestId, donorIds) => apiRequest(`/requests/${requestId}/invitations`, { method: 'POST', body: JSON.stringify({ donorIds }) }),
  cancelRequest: (requestId, reason) => apiRequest(`/requests/${requestId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getRequestHistory: () => apiRequest('/requests/history'),

  // Invitations
  getMyInvitations: () => apiRequest('/invitations/my'),
  getInvitationById: (id) => apiRequest(`/invitations/${id}`),
  acceptInvitation: (id) => apiRequest(`/invitations/${id}/accept`, { method: 'POST' }),
  declineInvitation: (id) => apiRequest(`/invitations/${id}/decline`, { method: 'POST' }),
  requestMistakenCancellation: (id, reason) => apiRequest(`/invitations/${id}/request-cancellation`, { method: 'POST', body: JSON.stringify({ reason }) }),
  approveCancellation: (id) => apiRequest(`/invitations/${id}/approve-cancellation`, { method: 'POST' }),
  rejectCancellation: (id, reason) => apiRequest(`/invitations/${id}/reject-cancellation`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'PATCH' }),

  // Donations
  getDonationHistory: () => apiRequest('/donations/history'),
  getDonationById: (id) => apiRequest(`/donations/${id}`)
};
