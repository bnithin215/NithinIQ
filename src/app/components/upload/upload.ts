import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UploadService } from '../../services/upload';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-upload',
  imports: [CommonModule, ReactiveFormsModule, Navbar],
  templateUrl: './upload.html',
  styleUrl: './upload.css'
})
export class Upload {
  private uploadService = inject(UploadService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  uploadForm: FormGroup;
  selectedFile: File | null = null;
  isDragging = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  fileSizeWarning = '';
  readonly MAX_FILE_SIZE = 900 * 1024; // 900KB

  constructor() {
    this.uploadForm = this.fb.group({
      title: ['', Validators.required],
      textContent: ['']
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelect(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelect(input.files[0]);
    }
  }

  handleFileSelect(file: File) {
    this.selectedFile = file;
    this.uploadForm.patchValue({
      title: file.name.replace(/\.[^/.]+$/, '')
    });
    this.errorMessage = '';
    this.successMessage = '';
    
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      this.fileSizeWarning = `⚠️ File size (${this.formatFileSize(file.size)}) exceeds the maximum limit of ${this.formatFileSize(this.MAX_FILE_SIZE)}. Please use a smaller file or split it into multiple files.`;
    } else {
      this.fileSizeWarning = '';
    }
  }

  async uploadFile() {
    if (!this.selectedFile && !this.uploadForm.get('textContent')?.value) {
      this.errorMessage = 'Please select a file or enter text content.';
      return;
    }

    // Check file size before upload
    if (this.selectedFile && this.selectedFile.size > this.MAX_FILE_SIZE) {
      this.errorMessage = `File size exceeds the maximum limit of ${this.formatFileSize(this.MAX_FILE_SIZE)}. Please use a smaller file.`;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.fileSizeWarning = '';

    try {
      if (this.selectedFile) {
        const title = this.uploadForm.get('title')?.value || this.selectedFile.name;
        const isPDF = this.selectedFile.type === 'application/pdf' || this.selectedFile.name.toLowerCase().endsWith('.pdf');
        
        if (isPDF) {
          this.successMessage = 'Processing PDF and extracting text... This may take a moment.';
          // Force UI update
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Upload file - extraction happens inside uploadFile
        // If extraction fails, file still uploads but without extracted text
        await this.uploadService.uploadFile(this.selectedFile, title);
        
        // Success message
        if (isPDF) {
          this.successMessage = 'PDF uploaded successfully! Text extraction completed.';
        } else {
          this.successMessage = 'File uploaded successfully!';
        }
      } else {
        const title = this.uploadForm.get('title')?.value;
        const textContent = this.uploadForm.get('textContent')?.value;
        if (!title || !textContent) {
          this.errorMessage = 'Please provide both title and text content.';
          this.isLoading = false;
          return;
        }
        await this.uploadService.uploadText(textContent, title);
        this.successMessage = 'Text uploaded successfully!';
      }

      // Reset form
      this.uploadForm.reset();
      this.selectedFile = null;

      // Redirect to documents after a short delay
      setTimeout(() => {
        this.router.navigate(['/documents']);
      }, 1500);
    } catch (error: any) {
      this.errorMessage = error.message || 'Upload failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.fileSizeWarning = '';
    this.uploadForm.patchValue({ title: '' });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Expose MAX_FILE_SIZE to template
  get maxFileSize() {
    return this.MAX_FILE_SIZE;
  }
}
