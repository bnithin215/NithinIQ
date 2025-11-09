import { Component, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionGeneratorService } from '../../services/question-generator';
import { UploadService, Document } from '../../services/upload';

@Component({
  selector: 'app-resume-qa',
  imports: [CommonModule],
  templateUrl: './resume-qa.html',
  styleUrl: './resume-qa.css'
})
export class ResumeQa implements OnInit {
  private questionGenerator = inject(QuestionGeneratorService);
  private uploadService = inject(UploadService);

  @Input() resumeDocument?: Document;
  
  questions: string[] = [];
  isLoading = false;
  errorMessage = '';
  hasResume = false;

  async ngOnInit() {
    await this.checkForResume();
    if (this.hasResume && !this.resumeDocument) {
      await this.loadQuestions();
    } else if (this.resumeDocument) {
      await this.loadQuestionsForDocument(this.resumeDocument);
    }
  }

  async checkForResume() {
    try {
      const resumeDocuments = await this.questionGenerator.getResumeDocuments();
      this.hasResume = resumeDocuments.length > 0;
      if (!this.resumeDocument && resumeDocuments.length > 0) {
        this.resumeDocument = resumeDocuments[0]; // Use first resume
      }
    } catch (error) {
      console.error('Error checking for resume:', error);
    }
  }

  async loadQuestions() {
    if (!this.hasResume) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.questions = [];

    try {
      const resumeDocuments = await this.questionGenerator.getResumeDocuments();
      if (resumeDocuments.length === 0) {
        this.errorMessage = 'No resume documents found. Please upload a resume first.';
        this.isLoading = false;
        return;
      }

      this.questions = await this.questionGenerator.generateResumeQuestions(resumeDocuments);
    } catch (error: any) {
      console.error('Error loading questions:', error);
      this.errorMessage = error.message || 'Failed to generate questions. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async loadQuestionsForDocument(document: Document) {
    this.isLoading = true;
    this.errorMessage = '';
    this.questions = [];

    try {
      this.questions = await this.questionGenerator.generateQuestionsForResume(document);
    } catch (error: any) {
      console.error('Error loading questions:', error);
      this.errorMessage = error.message || 'Failed to generate questions. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async refreshQuestions() {
    await this.loadQuestions();
  }

  copyQuestion(question: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    navigator.clipboard.writeText(question).then(() => {
      // Show visual feedback
      const button = event?.target as HTMLElement;
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '✓ Copied';
        button.style.color = 'var(--success-color)';
        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.color = '';
        }, 2000);
      }
    }).catch(err => {
      console.error('Failed to copy question:', err);
    });
  }
}

