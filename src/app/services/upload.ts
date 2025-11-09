import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, deleteDoc, getDoc, query, orderBy, serverTimestamp } from '@angular/fire/firestore';
import { AuthService } from './auth';

// Import PDF.js
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
// For Angular, we need to set the worker source
// Using CDN for reliability - worker must be loaded from same origin or CORS-enabled CDN
if (typeof window !== 'undefined') {
  const version = '5.4.394'; // Match installed version
  // Use jsdelivr CDN which is more reliable
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  console.log('✅ PDF.js worker configured:', pdfjsLib.GlobalWorkerOptions.workerSrc);
}

export interface Document {
  id?: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  content?: string; // Base64 encoded content for binary files, or plain text for text files
  isBase64?: boolean; // Flag to indicate if content is base64 encoded
  extractedText?: string; // Extracted text from PDFs and other documents for RAG
  createdAt: any;
  userId: string;
}

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);
  
  // Firestore has a 1MB limit per document
  private readonly MAX_FILE_SIZE = 900 * 1024; // 900KB to leave room for metadata

  /**
   * Convert file to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Extract text from PDF file
   */
  private async extractTextFromPDF(file: File): Promise<string> {
    try {
      console.log('🔍 Starting PDF text extraction for:', file.name);
      
      if (!pdfjsLib || !pdfjsLib.getDocument) {
        throw new Error('PDF.js library is not loaded. Please refresh the page and try again.');
      }

      const arrayBuffer = await file.arrayBuffer();
      console.log('📄 PDF file loaded, size:', arrayBuffer.byteLength, 'bytes');

      // Load PDF document with error handling
      let pdf;
      try {
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          verbosity: 0, // Suppress console warnings
          useSystemFonts: true // Better font handling
        });
        pdf = await loadingTask.promise;
      } catch (loadError: any) {
        console.error('Error loading PDF:', loadError);
        if (loadError?.message?.includes('password') || loadError?.name === 'PasswordException') {
          throw new Error('PDF is password-protected. Please remove the password and try again.');
        }
        throw new Error(`Failed to load PDF: ${loadError?.message || 'Unknown error'}`);
      }

      console.log('✅ PDF loaded successfully, pages:', pdf.numPages);

      if (pdf.numPages === 0) {
        throw new Error('PDF has no pages');
      }

      let fullText = '';
      const maxPages = Math.min(pdf.numPages, 100); // Limit to 100 pages for performance

      console.log(`📖 Extracting text from ${maxPages} page(s)...`);

      // Extract text from all pages
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Extract text items - handle different PDF.js versions
          const pageText = textContent.items
            .map((item: any) => {
              // Handle different item formats
              if (typeof item === 'string') {
                return item;
              }
              // PDF.js v2+ uses item.str
              if (item.str !== undefined) {
                return item.str || '';
              }
              // Older versions might use item.text
              if (item.text !== undefined) {
                return item.text || '';
              }
              // Some items have transform and other properties
              return '';
            })
            .filter((text: string) => text && typeof text === 'string' && text.trim().length > 0)
            .join(' ');
          
          if (pageText.trim().length > 0) {
            fullText += pageText + '\n\n';
          }
          
          // Log progress for large PDFs
          if (pageNum % 10 === 0) {
            console.log(`  Processed ${pageNum}/${maxPages} pages...`);
          }
        } catch (pageError: any) {
          console.warn(`⚠️ Error extracting text from page ${pageNum}:`, pageError?.message);
          // Continue with other pages - don't fail entire extraction
        }
      }

      const extractedText = fullText.trim();
      
      if (extractedText.length === 0) {
        console.warn('⚠️ No text could be extracted from PDF');
        throw new Error('No text content found in PDF. The PDF might be image-based (scanned document) or contain only images. Please upload a text-based PDF or use OCR to extract text first.');
      }

      console.log('✅ PDF text extraction completed!');
      console.log(`   Extracted ${extractedText.length} characters from ${maxPages} page(s)`);
      console.log(`   Preview: ${extractedText.substring(0, 100)}...`);
      
      return extractedText;
    } catch (error: any) {
      console.error('❌ Error extracting text from PDF:', error);
      const errorMessage = error?.message || 'Failed to extract text from PDF';
      
      // Re-throw with clear error message
      throw new Error(errorMessage);
    }
  }

  /**
   * Convert base64 string to Blob URL for display/download
   */
  createBlobURL(base64Content: string, mimeType: string): string {
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  async uploadFile(file: File, title?: string): Promise<Document> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check file size limit
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit of ${this.MAX_FILE_SIZE / 1024}KB. Please upload smaller files or use text upload for large documents.`);
    }

    try {
      const fileName = file.name;
      const fileType = file.type || 'application/octet-stream';
      const isPDF = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
      
      // Determine if file is text-based
      const isTextFile = fileType.startsWith('text/') || 
                        fileName.endsWith('.txt') || 
                        fileName.endsWith('.md') || 
                        fileName.endsWith('.json') ||
                        fileName.endsWith('.csv');

      let content: string;
      let isBase64: boolean;
      let extractedText: string | undefined;

      if (isTextFile) {
        // For text files, read as text
        content = await file.text();
        isBase64 = false;
        extractedText = content; // Use content directly for text files
      } else if (isPDF) {
        // For PDF files, extract text and store base64
        console.log('📄 Processing PDF file:', fileName, 'Size:', file.size, 'bytes');
        
        // Extract text from PDF (don't fail upload if extraction fails)
        try {
          console.log('⏳ Starting PDF text extraction...');
          extractedText = await this.extractTextFromPDF(file);
          
          if (extractedText && extractedText.trim().length > 0) {
            console.log('✅ PDF text extracted successfully!');
            console.log('   Extracted text length:', extractedText.length, 'characters');
            console.log('   Preview:', extractedText.substring(0, 200).replace(/\n/g, ' '));
          } else {
            console.warn('⚠️ PDF text extraction returned empty or null text');
            console.warn('   This might be an image-based PDF (scanned document)');
            extractedText = undefined;
          }
        } catch (error: any) {
          console.error('❌ PDF text extraction failed:', error);
          const errorMsg = error?.message || 'Unknown error during PDF text extraction';
          console.error('   Error message:', errorMsg);
          console.error('   Error stack:', error?.stack);
          
          // Check if it's an image-based PDF error
          if (errorMsg.includes('image-based') || errorMsg.includes('scanned') || errorMsg.includes('No text content')) {
            console.warn('   ⚠️ PDF appears to be image-based. Upload will continue without extracted text.');
          } else {
            console.error('   ❌ Unexpected error during PDF extraction');
          }
          
          // Continue with upload even if extraction fails
          extractedText = undefined;
        }
        
        // Always upload the file content (base64) even if text extraction failed
        console.log('📤 Converting PDF to base64 for storage...');
        content = await this.fileToBase64(file);
        isBase64 = true;
        console.log('✅ PDF converted to base64, length:', content.length);
      } else {
        // For other binary files, convert to base64
        content = await this.fileToBase64(file);
        isBase64 = true;
        // Try to extract text if it's a known text-based format
        if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
          // DOCX/DOC files would need a library like mammoth, but for now we'll skip
          extractedText = undefined;
        }
      }

      // Save to Firestore
      // Build document data object
      const documentData: any = {
        title: title || fileName,
        fileName: fileName,
        fileSize: file.size,
        fileType: fileType,
        content: content,
        isBase64: isBase64,
        createdAt: serverTimestamp(),
        userId: user.uid
      };

      // Only add extractedText if it exists and has content
      if (extractedText && extractedText.trim().length > 0) {
        documentData.extractedText = extractedText;
        console.log('✅ Document will be saved WITH extracted text (length:', extractedText.length, 'chars)');
      } else {
        console.log('⚠️ Document will be saved WITHOUT extracted text');
      }

      console.log('💾 Saving document to Firestore:', {
        title: documentData.title,
        fileName: documentData.fileName,
        hasExtractedText: !!documentData.extractedText,
        extractedTextLength: documentData.extractedText?.length || 0,
        fileType: documentData.fileType,
        fileSize: documentData.fileSize
      });

      const docRef = await addDoc(collection(this.firestore, 'users', user.uid, 'documents'), documentData);
      
      console.log('✅ Document saved to Firestore with ID:', docRef.id);
      
      // Verify what was actually saved
      try {
        const savedDoc = await getDoc(docRef);
        if (savedDoc.exists()) {
          const savedData = savedDoc.data();
          console.log('✅ Verified saved document:', {
            hasExtractedText: !!savedData['extractedText'],
            extractedTextLength: savedData['extractedText']?.length || 0,
            title: savedData['title']
          });
        }
      } catch (verifyError) {
        console.warn('Could not verify saved document:', verifyError);
      }

      return {
        id: docRef.id,
        ...documentData
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async uploadText(text: string, title: string): Promise<Document> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check text size limit
    const textSize = new Blob([text]).size;
    if (textSize > this.MAX_FILE_SIZE) {
      throw new Error(`Text size exceeds limit of ${this.MAX_FILE_SIZE / 1024}KB. Please use shorter text.`);
    }

    try {
      const documentData: Omit<Document, 'id'> = {
        title: title,
        fileName: `${title}.txt`,
        fileSize: textSize,
        fileType: 'text/plain',
        content: text,
        isBase64: false,
        createdAt: serverTimestamp(),
        userId: user.uid
      };

      const docRef = await addDoc(collection(this.firestore, 'users', user.uid, 'documents'), documentData);

      return {
        id: docRef.id,
        ...documentData
      };
    } catch (error) {
      console.error('Text upload error:', error);
      throw error;
    }
  }

  async getDocuments(): Promise<Document[]> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const documentsRef = collection(this.firestore, 'users', user.uid, 'documents');
      const q = query(documentsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Document));
    } catch (error) {
      console.error('Get documents error:', error);
      throw error;
    }
  }

  async deleteDocument(documentId: string, document: Document): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Delete from Firestore only
      await deleteDoc(doc(this.firestore, 'users', user.uid, 'documents', documentId));
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  }

  async getDocumentContent(document: Document): Promise<string> {
    try {
      console.log('Getting document content for:', document.fileName);
      console.log('Document data:', {
        hasExtractedText: !!document.extractedText,
        extractedTextLength: document.extractedText?.length || 0,
        isBase64: document.isBase64,
        hasContent: !!document.content,
        fileType: document.fileType
      });
      
      // If we have extracted text (from PDF or other documents), use that for RAG
      if (document.extractedText && document.extractedText.trim().length > 0) {
        console.log('Using extracted text for RAG, length:', document.extractedText.length);
        return document.extractedText;
      }

      // If it's a text file, use the content directly
      if (!document.isBase64 && document.content && document.content.trim().length > 0) {
        console.log('Using text file content directly');
        return document.content;
      }

      // For binary files without extracted text, return metadata
      if (document.isBase64) {
        const isPDF = document.fileType === 'application/pdf' || document.fileName.toLowerCase().endsWith('.pdf');
        if (isPDF) {
          console.warn('PDF has no extracted text. This might be an image-based PDF or extraction failed.');
          return `File: ${document.fileName}\nTitle: ${document.title}\nType: ${document.fileType}\nSize: ${document.fileSize} bytes\n\n[PDF text extraction failed or PDF contains no text. The PDF might be image-based, scanned, or password-protected. Please upload a text-based PDF for AI analysis.]`;
        }
        return `File: ${document.fileName}\nTitle: ${document.title}\nType: ${document.fileType}\nSize: ${document.fileSize} bytes\n\n[Text content could not be extracted from this file. Please upload text files or text-based PDFs for AI analysis.]`;
      }

      // Fallback
      console.warn('No content available for document:', document.fileName);
      return `No content available for ${document.fileName}`;
    } catch (error) {
      console.error('Get document content error:', error);
      throw error;
    }
  }

  /**
   * Get download URL for a document (creates a blob URL from base64 content)
   */
  getDownloadURL(document: Document): string {
    if (!document.content) {
      throw new Error('Document content not available');
    }

    if (document.isBase64) {
      return this.createBlobURL(document.content, document.fileType);
    } else {
      // For text files, create a blob from text content
      const blob = new Blob([document.content], { type: document.fileType });
      return URL.createObjectURL(blob);
    }
  }

  /**
   * Download a document as a file
   */
  downloadDocument(doc: Document): void {
    try {
      const url = this.getDownloadURL(doc);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Clean up the blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
}
