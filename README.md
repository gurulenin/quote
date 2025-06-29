# Invoice & Quotation App - Firebase Setup

## Database Configuration

This application uses Firebase Firestore as the backend database with the following features:

### Firebase Services Used

#### Firestore Database
- **Documents Collection**: Stores all invoice, quotation, and purchase order documents
- **User Sessions**: Custom session management for authentication
- **Real-time Sync**: Automatic synchronization across devices
- **Offline Support**: Works offline with automatic sync when online

### Security Features

1. **Firestore Security Rules**: Comprehensive rules ensuring data privacy
2. **User Data Isolation**: Each user can only access their own documents
3. **Session-based Authentication**: Custom 24-hour session management
4. **Input Validation**: Client and server-side data validation

### Environment Variables

Required environment variables in `.env`:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Key Features

- **Smart Document Numbering**: Auto-generates sequential document numbers by year
- **Duplicate Prevention**: Checks for existing document numbers before saving
- **Real-time Sync**: Automatic synchronization with Firebase Firestore
- **Backup/Restore**: Full backup functionality with cloud storage
- **Data Validation**: Comprehensive client and server-side validation
- **Offline Support**: Works offline with automatic sync when connection restored

### Setup Instructions

1. **Create Firebase Project**: Follow the setup guide in `FIREBASE_SETUP.md`
2. **Configure Firestore**: Set up database and security rules
3. **Set Environment Variables**: Add Firebase config to `.env` file
4. **Start Development Server**: Run `npm run dev`

### Database Collections

#### `documents`
```javascript
{
  id: "auto-generated-id",
  userId: "user-session-id",
  docType: "Invoice" | "Quotation" | "Purchase Order",
  docNumber: "#001/2024",
  companyData: { /* company information */ },
  clientData: { /* client information */ },
  shippingDetails: { /* shipping information */ },
  shippingSameAsBilling: true,
  docDetails: { /* document dates and details */ },
  bankDetails: { /* bank account information */ },
  items: [ /* array of line items */ ],
  totals: { /* calculated totals and GST */ },
  termsConditions: "terms text",
  upiId: "payment-upi-id",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /documents/{documentId} {
      allow read, write, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

### API Operations

The application uses Firebase Firestore SDK with the following main operations:

- **Create Document**: `addDoc()` - Add new invoice/quotation
- **Read Documents**: `getDocs()` - Fetch user documents with filtering
- **Update Document**: `updateDoc()` - Modify existing document
- **Delete Document**: `deleteDoc()` - Remove document
- **Real-time Sync**: Automatic updates across all connected clients

### Performance Features

- **Indexed Queries**: Optimized for fast document retrieval
- **Pagination**: Efficient loading of large document lists
- **Caching**: Local caching for improved performance
- **Batch Operations**: Efficient bulk operations for imports/exports

All operations are secured with Firestore security rules and provide automatic user isolation.