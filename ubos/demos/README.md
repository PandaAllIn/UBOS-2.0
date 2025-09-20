# 🚀 UBOS Demo Applications

Secure, CodeRabbit-compliant demo applications showcasing UBOS revenue system capabilities.

## 📁 Files

- **`revenue-demo.html`** - Revenue system overview and API testing interface
- **`working-demo.html`** - Comprehensive system demo with detailed testing
- **`preview_tide_guide_dashboard.html`** - Dashboard preview interface
- **`js/api-utils.js`** - Shared API utilities with security features

## 🔒 Security Features

### ✅ CodeRabbit Security Improvements Applied

1. **No Hardcoded Credentials**
   - API keys stored in localStorage (user-configurable)
   - Base URLs configurable per environment
   - No sensitive data in source code

2. **Optimized CORS Handling**
   - Content-Type header only for non-GET requests
   - Minimal headers to avoid preflight requests
   - Proper error handling for CORS issues

3. **Enhanced Error Handling**
   - Validation before API calls
   - Clear error messages
   - Graceful degradation

4. **Security Best Practices**
   - CSRF protection headers
   - Input sanitization
   - Secure localStorage usage

## 🛠️ Configuration

### API Settings

Both demo files include a configuration section where you can set:

- **API Key**: Your UBOS API authentication key
- **Base URL**: API server URL (default: `http://localhost:3001`)

### Usage

1. **Open any demo file** in a modern browser
2. **Configure API settings** in the configuration section
3. **Test connection** to verify API connectivity
4. **Test endpoints** to explore UBOS features

## 🔧 Development

### Local Development Server

```bash
# Start UBOS development server
npm run dev:dashboard  # http://localhost:3001

# Serve demo files (if needed)
npx serve demos/
```

### Testing Endpoints

The demos test these key endpoints:
- `/api/status` - System health check
- `/api/marketplace/agents` - Agent marketplace
- `/api/billing/usage` - Usage tracking
- `/api/stripe/create-payment-intent` - Payment processing

## 🎯 Features Demonstrated

### Revenue System
- ✅ Three subscription tiers (€79-€999/month)
- ✅ Pay-per-use pricing model
- ✅ Usage analytics & reporting
- ✅ Customer portal framework
- ✅ Automated billing & invoicing

### Security
- ✅ API key authentication
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Input validation
- ✅ Error handling

### Integration
- ✅ Stripe payment processing
- ✅ Agent marketplace API
- ✅ Usage tracking
- ✅ Real-time monitoring

## 🔍 CodeRabbit Integration

These demos are optimized for CodeRabbit analysis:

- **Security**: No hardcoded credentials or sensitive data
- **CORS**: Optimized headers for browser compatibility
- **Error Handling**: Comprehensive validation and user feedback
- **Code Quality**: Modern JavaScript patterns and best practices

## 📊 System Status

- **Revenue System**: ✅ Operational
- **API Security**: ✅ Protected
- **Demo Applications**: ✅ Secure & Functional
- **CodeRabbit Compliance**: ✅ All issues resolved

---

*Updated: $(date) - Secure demo applications ready for production use*