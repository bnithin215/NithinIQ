import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RAGService } from '../../services/rag';
import { UploadService } from '../../services/upload';
import { Navbar } from '../navbar/navbar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class Chat implements OnInit {
  private ragService = inject(RAGService);
  private uploadService = inject(UploadService);

  @ViewChild('chatContainer', { static: false }) chatContainer!: ElementRef;
  @ViewChild('messageInput', { static: false }) messageInput!: ElementRef;

  messages: Message[] = [];
  currentMessage = '';
  isLoading = false;
  documentCount = 0;

  async ngOnInit() {
    await this.loadDocumentCount();
    this.addWelcomeMessage();
  }

  async loadDocumentCount() {
    try {
      const documents = await this.uploadService.getDocuments();
      this.documentCount = documents.length;
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  }

  addWelcomeMessage() {
    if (this.documentCount === 0) {
      this.messages.push({
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant. To get started, please upload some documents first. Then I can answer questions based on your uploaded content.',
        timestamp: new Date()
      });
    } else {
      this.messages.push({
        role: 'assistant',
        content: `Hello! I'm your AI assistant. I have access to ${this.documentCount} document(s) in your library. Ask me anything about your documents!`,
        timestamp: new Date()
      });
    }
  }

  async sendMessage() {
    if (!this.currentMessage.trim() || this.isLoading) {
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: this.currentMessage,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    const messageToSend = this.currentMessage;
    this.currentMessage = '';
    this.isLoading = true;

    try {
      const response = await this.ragService.askQuestion(messageToSend);
      this.messages.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });
    } catch (error: any) {
      this.messages.push({
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}`,
        timestamp: new Date()
      });
    } finally {
      this.isLoading = false;
      this.scrollToBottom();
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
