# NithinIQ  
![NithinIQ Logo](https://github.com/bnithin215/NithinIQ/blob/main/public/logo.png?raw=true)

An intelligent document management and AI-powered Q&A platform built with Angular 17, Firebase, and OpenAI. Upload documents, extract text from PDFs, and get AI-powered answers based on your document content.

**Live Website:** [https://iqnithin.web.app/](https://iqnithin.web.app/)

---

## Features

- **Document Management**: Upload PDFs, text files, and other documents.  
- **PDF Text Extraction**: Automatic text extraction from PDF files for AI analysis.  
- **AI-Powered Q&A**: Ask questions about your uploaded documents using OpenAI GPT-4o-mini.  
- **Resume Q&A**: Generate 30 interview questions based on resume content.  
- **Firebase Authentication**: Email/Password, Google Sign-In, and Anonymous authentication.  
- **Firestore Storage**: Store documents and text content securely without Firebase Storage.  
- **Modern UI**: Responsive dark theme built with Angular 17.  
- **Real-time Updates**: Instant Firestore synchronization across devices.

---

## Tech Stack

- **Frontend**: Angular 17  
- **Backend**: Firebase (Authentication, Firestore)  
- **AI Integration**: OpenAI GPT-4o-mini  
- **PDF Processing**: Mozilla PDF.js  
- **Styling**: Custom dark CSS theme  

---

## Prerequisites

Ensure the following are installed before setup:

- Node.js (v18 or higher)  
- npm (v9 or higher)  
- Firebase CLI  
- OpenAI API key  

---

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/bnithin215/NithinIQ.git
cd NithinIQ
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy example environment files:

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts
```

Edit both files to include:

* Firebase configuration keys
* OpenAI API key

Detailed setup guide: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)

---

### 4. Configure Firebase

1. Create a project on [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication methods:

   * Email/Password
   * Google Sign-In
   * Anonymous (optional)
3. Create a Firestore database
4. Deploy Firestore security rules:

   ```bash
   firebase deploy --only firestore:rules
   ```

---

### 5. Run the Application

```bash
npm start
```

Then open your browser and visit:

```
http://localhost:4200/
```

---

## Build for Production

```bash
npm run build
```

The compiled output will be available in the `dist/` directory.

---

## Project Structure

```
NithinIQ/
├── src/
│   ├── app/
│   │   ├── components/      # UI components (login, dashboard, upload, etc.)
│   │   ├── services/        # Auth, Firestore, AI integration
│   │   ├── guards/          # Route guards
│   │   └── ...
│   ├── environments/        # Environment config
│   └── ...
├── public/                  # Static assets (logo, favicon, etc.)
├── firestore.rules          # Firestore security rules
└── ...
```

---

## Security Notes

* Do **not** commit API keys or sensitive credentials.
* Only commit placeholder environment files.
* Use `.gitignore` to protect local environment configs.

See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for more details.

---

## Testing

Run unit tests:

```bash
npm test
```

Run end-to-end tests:

```bash
npm run e2e
```

---

## Deployment

### Firebase Hosting

1. Build the app:

   ```bash
   npm run build
   ```
2. Deploy:

   ```bash
   firebase deploy
   ```

**Live Site:** [https://iqnithin.web.app/](https://iqnithin.web.app/)

---

## Documentation

* [Environment Setup Guide](./ENVIRONMENT_SETUP.md)

---


## Acknowledgments

* [Angular](https://angular.io/)
* [Firebase](https://firebase.google.com/)
* [OpenAI](https://openai.com/)
* [PDF.js](https://mozilla.github.io/pdf.js/)

---

## Support

For bugs or feature requests, open an issue at:
[https://github.com/bnithin215/NithinIQ/issues](https://github.com/bnithin215/NithinIQ/issues)


