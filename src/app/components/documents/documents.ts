import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UploadService, Document } from '../../services/upload';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-documents',
  imports: [CommonModule, RouterLink, Navbar],
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class Documents implements OnInit {
  private uploadService = inject(UploadService);

  documents: Document[] = [];
  isLoading = true;
  errorMessage = '';

  async ngOnInit() {
    await this.loadDocuments();
  }

  async loadDocuments() {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.documents = await this.uploadService.getDocuments();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to load documents.';
      console.error('Error loading documents:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteDocument(document: Document) {
    if (!document.id || !confirm(`Are you sure you want to delete "${document.title}"?`)) {
      return;
    }

    try {
      await this.uploadService.deleteDocument(document.id, document);
      await this.loadDocuments();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to delete document.';
      console.error('Error deleting document:', error);
    }
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('text')) return '📝';
    if (fileType.includes('word') || fileType.includes('document')) return '📘';
    return '📁';
  }

  getTotalFileSize(): string {
    const totalBytes = this.documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);
    return this.formatFileSize(totalBytes);
  }

  viewDocument(document: Document) {
    try {
      this.uploadService.downloadDocument(document);
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to view document.';
      console.error('Error viewing document:', error);
    }
  }

  downloadDocument(document: Document) {
    try {
      this.uploadService.downloadDocument(document);
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to download document.';
      console.error('Error downloading document:', error);
    }
  }
}
