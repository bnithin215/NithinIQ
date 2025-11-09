# Environment Setup Guide

This guide will help you set up your environment variables for the NithinIQ application.

## ⚠️ Important Security Note

**NEVER commit your actual API keys to GitHub!** The environment files in this repository contain placeholder values. You must add your own keys locally.

## Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Go to Project Settings → General
4. Scroll down to "Your apps" section
5. Click on the Web app icon (</>)
6. Copy your Firebase configuration

### 2. OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the API key (you won't be able to see it again!)

### 3. Configure Environment Files

#### For Development (environment.ts)

1. Open `src/environments/environment.ts`
2. Replace the placeholder values with your actual credentials:

```typescript
export const environment = {
    firebase: {
      apiKey: "YOUR_ACTUAL_FIREBASE_API_KEY",
      authDomain: "your-project.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef123456",
      measurementId: "G-XXXXXXXXXX"
    },
    openaiApiKey: "YOUR_ACTUAL_OPENAI_API_KEY"
};
```

#### For Production (environment.prod.ts)

1. Open `src/environments/environment.prod.ts`
2. Replace the placeholder values with your actual credentials (same as above)

### 4. Verify Setup

After configuring your environment files:

1. Run the development server:
   ```bash
   npm start
   ```

2. Check the browser console for any API key errors
3. Test Firebase authentication
4. Test OpenAI functionality (upload a document and ask a question)

## Firebase Setup Steps

### 1. Enable Authentication Methods

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable the following providers:
   - Email/Password
   - Google
   - Anonymous (optional)

### 2. Set Up Firestore Database

1. Go to Firebase Console → Firestore Database
2. Create a database in production mode (or test mode for development)
3. Set up security rules (see `firestore.rules`)
4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### 3. Configure Firestore Security Rules

The security rules are in `firestore.rules`. Make sure to deploy them:

```bash
firebase deploy --only firestore:rules
```

## Security Best Practices

1. **Never commit actual API keys** to version control
2. **Use different API keys** for development and production
3. **Restrict API key permissions** in Firebase Console
4. **Set up API key restrictions** in OpenAI dashboard
5. **Use environment variables** for sensitive data in production deployments
6. **Rotate API keys** periodically
7. **Monitor API usage** for unusual activity

## Troubleshooting

### Firebase Errors

- **"Missing or insufficient permissions"**: Check your Firestore security rules
- **"Firebase: Error (auth/configuration-not-found)"**: Verify your Firebase config in environment.ts
- **"Firebase: Error (auth/api-key-not-valid)"**: Check your API key in Firebase Console

### OpenAI Errors

- **"OpenAI API key is not configured"**: Verify your API key in environment.ts
- **"Incorrect API key provided"**: Check your API key in OpenAI dashboard
- **Rate limit errors**: Check your OpenAI usage limits

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Angular Environment Configuration](https://angular.io/guide/build#configuring-application-environments)

## Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Verify your API keys are correct
3. Check Firebase Console for authentication errors
4. Review the security rules in Firestore
5. Check OpenAI dashboard for API usage and errors

