/**
 * UBOS API Utilities - Secure API communication for demo applications
 * Addresses CodeRabbit security recommendations
 */

const API_SETTINGS_KEY = 'ubos_api_settings';

export const getApiSettings = () => {
    try {
        const settings = localStorage.getItem(API_SETTINGS_KEY);
        return settings ? JSON.parse(settings) : { 
            apiKey: '', 
            baseUrl: 'http://localhost:3001' // Default to UBOS development server
        };
    } catch (error) {
        console.error('Failed to parse API settings:', error);
        return { apiKey: '', baseUrl: 'http://localhost:3001' };
    }
};

export const saveApiSettings = (settings) => {
    try {
        // Validate settings before saving
        if (!settings || typeof settings !== 'object') {
            throw new Error('Invalid settings object');
        }
        
        // Sanitize URLs
        if (settings.baseUrl && !settings.baseUrl.match(/^https?:\/\//)) {
            settings.baseUrl = 'http://' + settings.baseUrl;
        }
        
        localStorage.setItem(API_SETTINGS_KEY, JSON.stringify(settings));
        return true;
    } catch (error) {
        console.error('Failed to save API settings:', error);
        return false;
    }
};

export const createApiRequest = (endpoint, method = 'GET', payload = null) => {
    const settings = getApiSettings();
    
    if (!settings.apiKey) {
        throw new Error('API key not configured. Please set your API key in settings.');
    }

    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${settings.apiKey}`,
            'X-Requested-With': 'XMLHttpRequest' // CSRF protection
        }
    };

    // Only add Content-Type for non-GET requests to optimize CORS
    if (method !== 'GET' && method !== 'HEAD') {
        options.headers['Content-Type'] = 'application/json';
        if (payload) {
            options.body = JSON.stringify(payload);
        }
    }

    // Add CORS settings for development
    options.mode = 'cors';
    options.credentials = 'omit'; // Don't send cookies for security

    return options;
};

export const makeSecureApiCall = async (endpoint, method = 'GET', payload = null) => {
    const { baseUrl } = getApiSettings();
    
    if (!baseUrl) {
        throw new Error('API base URL not configured. Please set your base URL in settings.');
    }

    // Validate endpoint format
    if (!endpoint.startsWith('/')) {
        endpoint = '/' + endpoint;
    }

    try {
        const options = createApiRequest(endpoint, method, payload);
        const response = await fetch(`${baseUrl}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};

// Utility function for testing API connectivity
export const testApiConnection = async () => {
    try {
        const response = await makeSecureApiCall('/health', 'GET');
        return { success: true, data: response };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Clear all stored settings (for logout/reset)
export const clearApiSettings = () => {
    localStorage.removeItem(API_SETTINGS_KEY);
};