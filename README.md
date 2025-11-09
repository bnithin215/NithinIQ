# NithinIQ

An intelligent document management and AI-powered Q&A platform built with Angular 17, Firebase, and OpenAI. Upload documents, extract text from PDFs, and get AI-powered answers based on your document content.

## 🚀 Features

- **Document Management**: Upload PDFs, text files, and other documents
- **PDF Text Extraction**: Automatic text extraction from PDF files for AI analysis
- **AI-Powered Q&A**: Ask questions about your uploaded documents using OpenAI GPT-4o-mini
- **Resume Q&A**: Generate 30 interview questions based on resume content
- **Firebase Authentication**: Support for Email/Password, Google Sign-In, and Anonymous authentication
- **Firestore Storage**: Store documents and content in Firestore (no Firebase Storage needed)
- **Modern UI**: Beautiful, responsive dark theme interface
- **Real-time Updates**: Real-time document sync with Firestore

## 🛠️ Tech Stack

- **Frontend**: Angular 17
- **Backend**: Firebase (Authentication, Firestore)
- **AI**: OpenAI GPT-4o-mini
- **PDF Processing**: PDF.js
- **Styling**: CSS3 with custom dark theme

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm (v9 or higher)
- Firebase account
- OpenAI API key

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/NithinIQ.git
cd NithinIQ
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

**⚠️ Important**: You must configure your API keys before running the application.

1. Copy the example environment files:
   ```bash
   cp src/environments/environment.example.ts src/environments/environment.ts
   cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts
   ```

2. Edit `src/environments/environment.ts` and `src/environments/environment.prod.ts`:
   - Add your Firebase configuration
   - Add your OpenAI API key

3. See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for detailed instructions.

### 4. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication methods:
   - Email/Password
   - Google Sign-In
   - Anonymous (optional)
3. Create a Firestore database
4. Deploy Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### 5. Run the Application

```bash
npm start
```

Navigate to `http://localhost:4200/` in your browser.

## 🏗️ Build for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## 📁 Project Structure

```
NithinIQ/
├── src/
│   ├── app/
│   │   ├── components/      # Angular components
│   │   ├── services/        # Services (Auth, Upload, RAG, Question Generator)
│   │   ├── guards/          # Route guards
│   │   └── ...
│   ├── environments/        # Environment configuration
│   └── ...
├── public/                  # Static assets (logo, etc.)
├── firestore.rules          # Firestore security rules
├── firebase.json            # Firebase configuration
└── ...
```

## 🔐 Security

**⚠️ Never commit your API keys to version control!**

- Environment files with placeholder values are committed to the repository
- Add your actual API keys locally in `src/environments/environment.ts`
- See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for security best practices

## 📚 Documentation

- [Environment Setup Guide](./ENVIRONMENT_SETUP.md) - Detailed environment configuration and security best practices

## 🧪 Testing

Run unit tests:
```bash
npm test
```

Run end-to-end tests:
```bash
npm run e2e
```

## 🚀 Deployment

### Firebase Hosting

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Angular](https://angular.io/)
- [Firebase](https://firebase.google.com/)
- [OpenAI](https://openai.com/)
- [PDF.js](https://mozilla.github.io/pdf.js/)

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Note**: Remember to configure your environment variables before running the application. See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for detailed instructions.
