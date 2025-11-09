import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UploadService, Document } from '../../services/upload';
import { QuestionGeneratorService } from '../../services/question-generator';
import { Navbar } from '../navbar/navbar';
import { ResumeQa } from '../resume-qa/resume-qa';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, Navbar, ResumeQa],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private uploadService = inject(UploadService);
  private questionGenerator = inject(QuestionGeneratorService);

  user$ = this.authService.user$;
  userData: any = null;
  documents: Document[] = [];
  isLoading = true;
  uploadCount = 0;
  hasResume = false;
  resumeDocument: Document | undefined;

  async ngOnInit() {
    this.user$.subscribe(async (user) => {
      if (user) {
        try {
          this.userData = await this.authService.getUserData(user.uid);
          // Handle anonymous users
          if (user.isAnonymous) {
            this.userData = {
              ...this.userData,
              isAnonymous: true,
              name: 'Anonymous User',
              email: '',
              phone: ''
            };
          }
          await this.loadDocuments();
        } catch (error) {
          console.error('Error loading user data:', error);
          // Set default user data if fetch fails
          const currentUser = this.authService.getCurrentUser();
          if (currentUser?.isAnonymous) {
            this.userData = {
              name: 'Anonymous User',
              email: '',
              phone: '',
              isAnonymous: true
            };
          } else {
            this.userData = {
              name: user.displayName || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              phone: user.phoneNumber || ''
            };
          }
          await this.loadDocuments();
        }
      }
    });
  }

  async loadDocuments() {
    try {
      this.isLoading = true;
      this.documents = await this.uploadService.getDocuments();
      this.uploadCount = this.documents.length;
      
      // Check for resume documents
      await this.checkForResume();
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async checkForResume() {
    try {
      const resumeDocuments = await this.questionGenerator.getResumeDocuments();
      this.hasResume = resumeDocuments.length > 0;
      if (resumeDocuments.length > 0) {
        this.resumeDocument = resumeDocuments[0]; // Use first resume
      }
    } catch (error) {
      console.error('Error checking for resume:', error);
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
}
