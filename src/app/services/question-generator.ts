import { Injectable, inject } from '@angular/core';
import { UploadService, Document } from './upload';
import { environment } from '../../environments/environment';
import OpenAI from 'openai';

@Injectable({
  providedIn: 'root',
})
export class QuestionGeneratorService {
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

  /**
   * Check if a document is a resume
   */
  async isResume(document: Document): Promise<boolean> {
    const fileName = document.fileName.toLowerCase();
    const title = document.title.toLowerCase();
    
    // Check for resume keywords in filename or title
    const resumeKeywords = ['resume', 'cv', 'curriculum vitae', 'bio', 'biography'];
    const hasResumeKeyword = resumeKeywords.some(keyword => 
      fileName.includes(keyword) || title.includes(keyword)
    );

    if (hasResumeKeyword) {
      return true;
    }

    // If no keyword found, check document content for resume indicators
    try {
      const content = await this.uploadService.getDocumentContent(document);
      const contentLower = content.toLowerCase();
      
      // Common resume sections
      const resumeSections = [
        'objective', 'summary', 'experience', 'education', 'skills',
        'work history', 'employment', 'professional experience',
        'qualifications', 'achievements', 'projects', 'certifications',
        'references', 'contact information', 'phone', 'email', 'address'
      ];

      // Check if content contains multiple resume sections
      const sectionMatches = resumeSections.filter(section => 
        contentLower.includes(section)
      ).length;

      // If 3 or more resume sections are found, likely a resume
      return sectionMatches >= 3;
    } catch (error) {
      console.error('Error checking document content for resume:', error);
      return false;
    }
  }

  /**
   * Check if a document is a resume (synchronous version using filename/title only)
   */
  isResumeSync(document: Document): boolean {
    const fileName = document.fileName.toLowerCase();
    const title = document.title.toLowerCase();
    
    // Check for resume keywords in filename or title
    const resumeKeywords = ['resume', 'cv', 'curriculum vitae', 'bio', 'biography'];
    return resumeKeywords.some(keyword => 
      fileName.includes(keyword) || title.includes(keyword)
    );
  }

  /**
   * Get all resume documents
   */
  async getResumeDocuments(): Promise<Document[]> {
    const documents = await this.uploadService.getDocuments();
    const resumeDocuments: Document[] = [];

    // First, filter by filename/title (fast check)
    const potentialResumes = documents.filter(doc => this.isResumeSync(doc));
    
    // Then verify by content for documents without resume keywords
    for (const doc of documents) {
      if (potentialResumes.includes(doc)) {
        resumeDocuments.push(doc);
      } else {
        // Check content for documents without resume keywords
        const isResumeDoc = await this.isResume(doc);
        if (isResumeDoc) {
          resumeDocuments.push(doc);
        }
      }
    }

    return resumeDocuments;
  }

  /**
   * Generate 30 interview questions based on resume content
   */
  async generateResumeQuestions(resumeDocuments: Document[]): Promise<string[]> {
    if (!this.openai) {
      throw new Error('OpenAI API key is not configured.');
    }

    if (resumeDocuments.length === 0) {
      throw new Error('No resume documents found.');
    }

    try {
      // Get content from all resume documents
      let resumeContent = 'Resume Content:\n\n';
      for (const doc of resumeDocuments) {
        try {
          const content = await this.uploadService.getDocumentContent(doc);
          resumeContent += `Document: ${doc.title}\n${content}\n\n`;
        } catch (error) {
          console.error(`Error fetching content for ${doc.title}:`, error);
        }
      }

      // Generate questions using OpenAI
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert interview question generator. Based on the resume content provided, generate exactly 30 relevant interview questions.

The questions should cover:
- Technical skills and experience (about 10 questions)
- Behavioral and situational questions (about 8 questions)
- Problem-solving and analytical thinking (about 5 questions)
- Leadership and teamwork (about 4 questions)
- Career goals and motivation (about 3 questions)

IMPORTANT: Return ONLY a numbered list from 1 to 30. Each line should start with the number followed by a period and space, then the question. Do not include any headers, explanations, or additional text.

Example format:
1. What programming languages are you most proficient in?
2. Tell me about a challenging project you worked on.
3. How do you handle tight deadlines?

Generate 30 questions based on this resume:`
          },
          {
            role: 'user',
            content: `${resumeContent}\n\nGenerate exactly 30 interview questions based on this resume content.`
          }
        ],
        max_tokens: 2500,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content || '';
      
      // Parse the questions from the response
      let questions = this.parseQuestions(response);
      
      // If we don't have 30 questions, try to generate more
      if (questions.length < 30) {
        console.warn(`Generated ${questions.length} questions, expected 30. Attempting to generate more...`);
        
        // If we have at least 15 questions, try to generate additional ones
        if (questions.length >= 15) {
          try {
            const additionalCompletion = await this.openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: `Generate ${30 - questions.length} additional interview questions based on the resume. Return only numbered questions, one per line.`
                },
                {
                  role: 'user',
                  content: `${resumeContent}\n\nGenerate ${30 - questions.length} more interview questions. Do not repeat these existing questions:\n${questions.slice(0, 5).map((q, i) => `${i + 1}. ${q}`).join('\n')}`
                }
              ],
              max_tokens: 1000,
              temperature: 0.7
            });
            
            const additionalResponse = additionalCompletion.choices[0]?.message?.content || '';
            const additionalQuestions = this.parseQuestions(additionalResponse);
            questions = [...questions, ...additionalQuestions];
          } catch (error) {
            console.warn('Failed to generate additional questions:', error);
          }
        } else {
          // If we have very few questions, retry the entire generation
          console.log('Too few questions generated, retrying...');
          return await this.generateResumeQuestions(resumeDocuments);
        }
      }
      
      // Return exactly 30 questions (or all if we have fewer)
      return questions.slice(0, 30);
    } catch (error) {
      console.error('Error generating resume questions:', error);
      throw error;
    }
  }

  /**
   * Parse questions from OpenAI response
   */
  private parseQuestions(response: string): string[] {
    // Split by newlines and filter out empty lines
    const lines = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const questions: string[] = [];

    for (const line of lines) {
      // Skip lines that are clearly not questions (headers, etc.)
      if (line.match(/^(question|category|section|note)/i)) {
        continue;
      }

      // Remove numbering (1., 1), 1- etc.) and extract the question
      let cleaned = line
        .replace(/^\d+[.)-]\s*/, '') // Remove "1. ", "1) ", "1- "
        .replace(/^-\s*/, '') // Remove "- "
        .replace(/^\*\s*/, '') // Remove "* "
        .replace(/^[a-z][.)]\s*/i, '') // Remove "a. " or "A. "
        .trim();

      // Remove common prefixes
      cleaned = cleaned
        .replace(/^(q:|question:)/i, '')
        .trim();

      // Only add if it looks like a question (ends with ? or is a reasonable length and seems like a question)
      if (cleaned.length > 15) {
        // Add question mark if it doesn't have one but seems like a question
        if (!cleaned.endsWith('?') && !cleaned.endsWith('.') && !cleaned.endsWith(':')) {
          // Check if it starts with question words
          if (cleaned.match(/^(what|how|why|when|where|who|tell|describe|explain|can you|do you|have you)/i)) {
            cleaned += '?';
          }
        }
        
        questions.push(cleaned);
      }
    }

    // Remove duplicates
    const uniqueQuestions = Array.from(new Set(questions));
    
    return uniqueQuestions;
  }

  /**
   * Generate questions for a specific resume document
   */
  async generateQuestionsForResume(resumeDocument: Document): Promise<string[]> {
    return await this.generateResumeQuestions([resumeDocument]);
  }
}

