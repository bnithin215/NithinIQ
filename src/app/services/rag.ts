import { Injectable, inject } from '@angular/core';
import { UploadService, Document } from './upload';
import { environment } from '../../environments/environment';
import OpenAI from 'openai';

@Injectable({
  providedIn: 'root',
})
export class RAGService {
  private uploadService: UploadService = inject(UploadService);
  private openai: OpenAI | null = null;

  constructor() {
    if (environment.openaiApiKey && environment.openaiApiKey !== 'YOUR_OPENAI_API_KEY') {
      this.openai = new OpenAI({
        apiKey: environment.openaiApiKey,
        dangerouslyAllowBrowser: true
      });
    }
  }

  async askQuestion(question: string): Promise<string> {
    if (!this.openai) {
      return 'OpenAI API key is not configured. Please set your OpenAI API key in the environment file.';
    }

    try {
      // Get all user documents
      const documents = await this.uploadService.getDocuments();
      
      if (documents.length === 0) {
        return 'You have not uploaded any documents yet. Please upload some documents first to get contextual answers.';
      }

      // Build context from documents
      let context = 'User has uploaded the following documents:\n\n';
      for (const doc of documents) {
        try {
          const content = await this.uploadService.getDocumentContent(doc);
          context += `Document: ${doc.title}\nContent: ${content}\n\n`;
        } catch (error) {
          console.error(`Error fetching content for ${doc.title}:`, error);
          context += `Document: ${doc.title}\n[Content unavailable]\n\n`;
        }
      }

      // Create OpenAI chat completion
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that answers questions based on the user\'s uploaded documents. Use the context provided to give accurate, contextual answers. If the answer cannot be found in the documents, say so clearly.'
          },
          {
            role: 'user',
            content: `${context}\n\nQuestion: ${question}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      return completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('RAG service error:', error);
      return `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
    }
  }
}
