# 🔍 Firestore Indexes Setup Guide

## Required Indexes for Invoice & Quotation App

Your application requires specific composite indexes for efficient querying. Follow these steps to set them up:

## 🚨 Immediate Action Required

You're seeing this error because Firebase needs indexes for complex queries:
```
The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/quote-test-cd354/firestore/indexes?create_composite=...
```

## 📋 Required Composite Indexes

### 1. Documents by User and Creation Date
**Collection**: `documents`
**Fields**:
- `userId` (Ascending)
- `createdAt` (Descending)

**Purpose**: Load user documents sorted by creation date

### 2. Documents by User and Type
**Collection**: `documents`
**Fields**:
- `userId` (Ascending)
- `docType` (Ascending)
- `createdAt` (Descending)

**Purpose**: Filter documents by type for the same user

### 3. Documents by User, Type, and Number
**Collection**: `documents`
**Fields**:
- `userId` (Ascending)
- `docType` (Ascending)
- `docNumber` (Ascending)

**Purpose**: Check for duplicate document numbers

## 🔧 Setup Methods

### Method 1: Automatic Index Creation (Recommended)

1. **Use the Error Link**: Click the link in your browser console error
2. **Review Index**: Firebase will show you the exact index needed
3. **Create Index**: Click "Create Index"
4. **Wait for Build**: Index creation takes 2-5 minutes

### Method 2: Manual Index Creation

1. Go to [Firebase Console](https://console.firebase.google.com/project/quote-test-cd354/firestore/indexes)
2. Click **"Create Index"**
3. Configure each index:

#### Index 1: User Documents by Date
```
Collection ID: documents
Fields:
  - userId: Ascending
  - createdAt: Descending
Query Scopes: Collection
```

#### Index 2: User Documents by Type and Date
```
Collection ID: documents
Fields:
  - userId: Ascending
  - docType: Ascending  
  - createdAt: Descending
Query Scopes: Collection
```

#### Index 3: Duplicate Number Check
```
Collection ID: documents
Fields:
  - userId: Ascending
  - docType: Ascending
  - docNumber: Ascending
Query Scopes: Collection
```

### Method 3: Firebase CLI (Advanced)

If you have Firebase CLI installed:

1. Create `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "documents",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "documents",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "docType",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "documents",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "docType",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "docNumber",
          "order": "ASCENDING"
        }
      ]
    }
  ]
}
```

2. Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

## ⏱️ Index Build Time

- **Small datasets** (< 1000 documents): 1-2 minutes
- **Medium datasets** (1000-10000 documents): 2-5 minutes  
- **Large datasets** (> 10000 documents): 5-15 minutes

## 🔍 Verify Index Status

1. Go to [Firestore Indexes](https://console.firebase.google.com/project/quote-test-cd354/firestore/indexes)
2. Check that all indexes show **"Enabled"** status
3. If any show **"Building"**, wait for completion

## 🧪 Test After Index Creation

Once indexes are built:

1. Refresh your application
2. Try loading documents
3. Create a new document
4. Check for any remaining index errors

## 🚨 Common Issues

### "Index still building"
- **Solution**: Wait for index completion (check Firebase Console)
- **Status**: Indexes show "Building" → "Enabled"

### "Permission denied"
- **Solution**: Check Firestore security rules
- **Verify**: Rules allow read/write for authenticated users

### "Still getting index errors"
- **Solution**: Clear browser cache and reload
- **Check**: All required indexes are "Enabled"

## 📊 Query Performance

With proper indexes:
- **Document loading**: < 100ms
- **Duplicate checking**: < 50ms
- **Type filtering**: < 100ms
- **Search operations**: < 200ms

## 🔐 Security Rules Update

Ensure your security rules support the indexed queries:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /documents/{documentId} {
      // Allow read/write for authenticated users on their own documents
      allow read, write, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
        
      // Allow queries with userId filter
      allow list: if request.auth != null && 
        request.query.filters.hasAll(['userId']) &&
        request.query.filters.userId == request.auth.uid;
    }
  }
}
```

## ✅ Completion Checklist

- [ ] All 3 composite indexes created
- [ ] All indexes show "Enabled" status  
- [ ] Application loads without index errors
- [ ] Document operations work correctly
- [ ] No console errors related to indexes

## 🆘 Need Help?

If you continue having issues:

1. **Check Firebase Console**: Look for index build status
2. **Browser Console**: Check for specific error messages
3. **Clear Cache**: Hard refresh the application
4. **Verify Rules**: Ensure security rules are correct

---

**⚡ Quick Fix**: Click the index creation link in your browser console error - this is the fastest way to create the exact index Firebase needs!

Once indexes are built, your application will run smoothly with fast, efficient queries.