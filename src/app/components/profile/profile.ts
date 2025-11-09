import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UploadService } from '../../services/upload';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, RouterLink, Navbar],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  private authService = inject(AuthService);
  private uploadService = inject(UploadService);

  user$ = this.authService.user$;
  userData: any = null;
  documentCount = 0;
  isLoading = true;

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
          await this.loadDocumentCount();
        } catch (error) {
          console.error('Error loading user data:', error);
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
          await this.loadDocumentCount();
        } finally {
          this.isLoading = false;
        }
      }
    });
  }

  async loadDocumentCount() {
    try {
      const documents = await this.uploadService.getDocuments();
      this.documentCount = documents.length;
    } catch (error) {
      console.error('Error loading document count:', error);
    }
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  async logout() {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
