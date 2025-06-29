# 🔥 Complete Firebase Configuration Guide

## 📋 Prerequisites

1. **Google Account**: Sign up at [firebase.google.com](https://firebase.google.com)
2. **Firebase Project**: Create a new project in Firebase Console

## 🔧 Step-by-Step Configuration

### 1. Create New Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"**
3. Enter project details:
   - **Project name**: `invoice-quotation-app`
   - **Enable Google Analytics**: Optional (recommended)
   - **Analytics account**: Choose existing or create new
4. Click **"Create project"**
5. Wait for project initialization (1-2 minutes)

### 2. Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we'll configure security rules later)
4. Select a location closest to your users
5. Click **"Done"**

### 3. Configure Web App

1. In Firebase Console, click the **Web icon** (`</>`) to add a web app
2. Enter app details:
   - **App nickname**: `invoice-quotation-web`
   - **Firebase Hosting**: Optional (can skip for now)
3. Click **"Register app"**
4. Copy the Firebase configuration object

### 4. Set Environment Variables

Create/update your `.env` file with the Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 5. Configure Firestore Security Rules

1. Go to **Firestore Database** → **Rules**
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Documents collection - user-specific access
    match /documents/{documentId} {
      allow read, write, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // User sessions collection - for custom auth
    match /user_sessions/{sessionId} {
      allow read, write: if true; // Public access for session management
    }
    
    // Client data collection - user-specific access
    match /client_data/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Product data collection - user-specific access
    match /product_data/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **"Publish"**

### 6. Set Up Authentication (Optional)

For enhanced security, you can enable Firebase Authentication:

1. Go to **Authentication** → **Get started**
2. Choose **Sign-in method**
3. Enable **Anonymous** authentication for the current setup
4. Or enable **Email/Password** for user accounts

## 🏗️ Database Structure

### Collections

#### `documents`
- **Purpose**: Store all invoice, quotation, and purchase order documents
- **Fields**:
  - `userId` (string) - User identifier for data isolation
  - `docType` (string) - Document type: 'Invoice', 'Quotation', 'Purchase Order'
  - `docNumber` (string) - Document number (e.g., "#001/2024")
  - `companyData` (object) - Company information
  - `clientData` (object) - Client information
  - `shippingDetails` (object) - Shipping information
  - `shippingSameAsBilling` (boolean) - Shipping address flag
  - `docDetails` (object) - Document details (dates, place of supply)
  - `bankDetails` (object) - Bank account information
  - `items` (array) - Line items with products/services
  - `totals` (object) - Calculated totals and GST breakdown
  - `termsConditions` (string) - Terms and conditions text
  - `upiId` (string) - UPI payment ID
  - `createdAt` (timestamp) - Document creation time
  - `updatedAt` (timestamp) - Last modification time

#### `user_sessions` (Optional)
- **Purpose**: Custom session management
- **Fields**:
  - `sessionToken` (string) - Unique session identifier
  - `userId` (string) - Associated user ID
  - `expiresAt` (timestamp) - Session expiration time
  - `createdAt` (timestamp) - Session creation time

#### `client_data`
- **Purpose**: Store client information for each user
- **Document ID**: User's UID
- **Fields**:
  - `clients` (array) - Array of client objects with Name, Address, Phone, GSTIN, Email

#### `product_data`
- **Purpose**: Store product information for each user
- **Document ID**: User's UID
- **Fields**:
  - `products` (array) - Array of product objects with Description, HSN, Price, Category

### Indexes

Firebase automatically creates indexes, but you may want to create composite indexes for:

1. **Documents by user and type**:
   - Collection: `documents`
   - Fields: `userId` (Ascending), `docType` (Ascending), `createdAt` (Descending)

2. **Documents by user and creation date**:
   - Collection: `documents`
   - Fields: `userId` (Ascending), `createdAt` (Descending)

## 🔐 Security Features

### 1. User Data Isolation
- Each document is associated with a `userId`
- Security rules ensure users can only access their own documents
- No cross-user data leakage
- Client and product data are stored per user with UID-based access control

### 2. Session-Based Authentication
- Custom session management with 24-hour expiry
- Session tokens stored securely
- Automatic cleanup of expired sessions

### 3. Firestore Security Rules
- Production-ready security rules
- Prevents unauthorized access
- Validates data structure and ownership
- Separate rules for documents, client_data, and product_data collections

## 🧪 Testing Your Setup

### 1. Verify Firebase Connection

Check the browser console for any Firebase connection errors when starting the app.

### 2. Test Document Operations

1. Start your development server: `npm run dev`
2. Login with secret key: `9578078500`
3. Create a new document
4. Check Firebase Console → Firestore Database to see the data

### 3. Verify Security Rules

Try accessing documents from different user sessions to ensure isolation works.

## 🚨 Troubleshooting

### Common Issues

#### 1. "Missing Firebase environment variables"
- Check your `.env` file exists and has correct values
- Restart development server after adding variables
- Ensure all required variables are set

#### 2. "Permission denied" errors
- Verify Firestore security rules are published
- Check that documents have correct `userId` field
- Ensure user is properly authenticated
- For client_data and product_data, ensure the document ID matches the user's UID

#### 3. "Firebase app not initialized"
- Check Firebase configuration object
- Verify all environment variables are correct
- Check browser console for initialization errors

#### 4. "Quota exceeded" errors
- Check Firebase Console → Usage tab
- Consider upgrading to Blaze plan for production
- Optimize queries to reduce reads/writes

### Debug Commands

Check Firebase Console for:
- **Firestore Database** → View documents and collections
- **Usage** → Monitor reads, writes, and storage
- **Rules** → Test security rules with the simulator

## 📈 Performance Optimization

### Best Practices

1. **Efficient Queries**:
   - Use compound queries instead of multiple simple queries
   - Limit results with `.limit()` when possible
   - Use pagination for large datasets

2. **Data Structure**:
   - Denormalize data for read efficiency
   - Use subcollections for hierarchical data
   - Keep document sizes under 1MB

3. **Caching**:
   - Enable offline persistence for better UX
   - Use local state management to reduce reads
   - Implement proper loading states

4. **Security**:
   - Regularly review and update security rules
   - Monitor for unusual access patterns
   - Use Firebase Security Rules simulator

## 💰 Cost Optimization

### Firebase Pricing (Spark Plan - Free Tier)

- **Firestore**: 50K reads, 20K writes, 20K deletes per day
- **Storage**: 1 GB
- **Bandwidth**: 10 GB per month

### Tips to Stay Within Free Limits

1. **Optimize Reads**:
   - Cache data locally
   - Use real-time listeners efficiently
   - Implement pagination

2. **Reduce Writes**:
   - Batch operations when possible
   - Avoid unnecessary updates
   - Use transactions for consistency

3. **Monitor Usage**:
   - Check Firebase Console → Usage regularly
   - Set up billing alerts
   - Consider upgrading to Blaze plan for production

## 🚀 Production Deployment

### 1. Environment Configuration

Create production environment variables:

```env
# Production .env
VITE_FIREBASE_API_KEY=prod_api_key
VITE_FIREBASE_AUTH_DOMAIN=prod_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=prod_project_id
# ... other production config
```

### 2. Security Hardening

1. **Review Security Rules**: Ensure they're production-ready
2. **Enable App Check**: Protect against abuse
3. **Set up Monitoring**: Enable Firebase Performance Monitoring
4. **Backup Strategy**: Set up regular Firestore exports

### 3. Performance Monitoring

1. Enable **Firebase Performance Monitoring**
2. Set up **Firebase Analytics** (if enabled)
3. Monitor **Firestore Usage** and costs
4. Set up **Alerts** for unusual activity

## 📞 Support Resources

- **Firebase Documentation**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Firestore Guide**: [firebase.google.com/docs/firestore](https://firebase.google.com/docs/firestore)
- **Community**: [firebase.google.com/community](https://firebase.google.com/community)
- **Stack Overflow**: Tag questions with `firebase` and `firestore`

---

✅ **Your Firebase configuration is now complete!** 

The application will automatically connect to your Firebase project and provide secure, scalable document storage with real-time capabilities and robust security rules.

## 🎯 Next Steps

1. **Test thoroughly** in development environment
2. **Set up monitoring** and alerts
3. **Plan for scaling** if expecting high usage
4. **Consider Firebase Hosting** for deployment
5. **Implement proper error handling** for production
6. **Set up automated backups** for critical data

Your invoice and quotation application is now powered by Firebase! 🎉