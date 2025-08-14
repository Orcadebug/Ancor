import fs from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import PDFParse from 'pdf-parse';
import mammoth from 'mammoth';
import { ChromaClient } from 'chromadb';
import { prisma } from '@/config/database.js';
import { logger } from '@/utils/logger.js';
import { Document, DocumentStatus, DocumentMetadata } from '@/types/index.js';

export class DocumentProcessingService {
  private s3Client: S3Client;
  private chromaClient: ChromaClient;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });

    this.chromaClient = new ChromaClient({
      host: process.env.CHROMADB_HOST || 'localhost',
      port: parseInt(process.env.CHROMADB_PORT || '8000')
    });

    this.bucketName = process.env.AWS_S3_BUCKET!;
  }

  /**
   * Upload and process a document
   */
  async uploadDocument(
    file: Express.Multer.File,
    organizationId: string,
    deploymentId: string
  ): Promise<Document> {
    try {
      logger.info(`Processing document upload: ${file.originalname}`);

      // Generate unique S3 key
      const fileExtension = path.extname(file.originalname);
      const s3Key = `${organizationId}/${deploymentId}/${Date.now()}-${file.originalname}`;

      // Upload to S3
      await this.uploadToS3(file.buffer, s3Key, file.mimetype);

      // Create document record
      const document = await prisma.document.create({
        data: {
          organizationId,
          deploymentId,
          filename: s3Key,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          s3Key,
          status: DocumentStatus.UPLOADED,
          metadata: {}
        }
      });

      // Process document asynchronously
      this.processDocumentAsync(document.id);

      logger.info(`Document ${document.id} uploaded successfully`);
      return document;

    } catch (error) {
      logger.error('Failed to upload document:', error);
      throw error;
    }
  }

  /**
   * Process document asynchronously (extract text, generate embeddings, etc.)
   */
  private async processDocumentAsync(documentId: string): Promise<void> {
    try {
      logger.info(`Starting async processing for document ${documentId}`);

      // Update status to processing
      await prisma.document.update({
        where: { id: documentId },
        data: { status: DocumentStatus.PROCESSING }
      });

      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Download file from S3
      const fileBuffer = await this.downloadFromS3(document.s3Key);

      // Extract text based on file type
      const extractedText = await this.extractText(fileBuffer, document.mimeType);

      // Generate metadata
      const metadata = await this.generateMetadata(extractedText, document.originalName);

      // Generate summary
      const summary = await this.generateSummary(extractedText);

      // Create embeddings and store in ChromaDB
      const embeddings = await this.generateAndStoreEmbeddings(
        documentId,
        extractedText,
        document.deploymentId
      );

      // Update document with processed data
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.PROCESSED,
          extractedText,
          summary,
          metadata: metadata as any,
          embeddings: embeddings,
          updatedAt: new Date()
        }
      });

      logger.info(`Document ${documentId} processed successfully`);

    } catch (error) {
      logger.error(`Failed to process document ${documentId}:`, error);
      
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.FAILED,
          processingError: error.message,
          updatedAt: new Date()
        }
      });
    }
  }

  /**
   * Search documents using semantic search
   */
  async searchDocuments(
    query: string,
    deploymentId: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      logger.info(`Searching documents for deployment ${deploymentId}: "${query}"`);

      // Get the ChromaDB collection for this deployment
      const collection = await this.chromaClient.getCollection({
        name: `deployment-${deploymentId}`
      });

      // Perform semantic search
      const results = await collection.query({
        queryTexts: [query],
        nResults: limit,
        include: ['documents', 'metadatas', 'distances']
      });

      // Format results
      const formattedResults = results.documents[0].map((doc: string, index: number) => ({
        documentId: results.metadatas[0][index].documentId,
        content: doc,
        relevanceScore: 1 - results.distances[0][index], // Convert distance to similarity
        metadata: results.metadatas[0][index]
      }));

      logger.info(`Found ${formattedResults.length} relevant documents`);
      return formattedResults;

    } catch (error) {
      logger.error('Failed to search documents:', error);
      throw error;
    }
  }

  /**
   * Delete document and cleanup
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      logger.info(`Deleting document ${documentId}`);

      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Delete from S3
      await this.deleteFromS3(document.s3Key);

      // Delete from ChromaDB
      await this.deleteFromChromaDB(documentId, document.deploymentId);

      // Delete from database
      await prisma.document.delete({
        where: { id: documentId }
      });

      logger.info(`Document ${documentId} deleted successfully`);

    } catch (error) {
      logger.error(`Failed to delete document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Get document processing status
   */
  async getDocumentStatus(documentId: string): Promise<any> {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      return {
        id: document.id,
        filename: document.originalName,
        status: document.status,
        progress: this.getProcessingProgress(document.status),
        error: document.processingError,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      };

    } catch (error) {
      logger.error(`Failed to get document status ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ServerSideEncryption: 'AES256'
    });

    await this.s3Client.send(command);
  }

  private async downloadFromS3(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    const response = await this.s3Client.send(command);
    const chunks: Uint8Array[] = [];
    
    if (response.Body && typeof response.Body.on === 'function') {
      return new Promise((resolve, reject) => {
        response.Body!.on('data', (chunk) => chunks.push(chunk));
        response.Body!.on('end', () => resolve(Buffer.concat(chunks)));
        response.Body!.on('error', reject);
      });
    }
    
    throw new Error('Failed to download file from S3');
  }

  private async deleteFromS3(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    await this.s3Client.send(command);
  }

  private async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      switch (mimeType) {
        case 'application/pdf':
          const pdfData = await PDFParse(buffer);
          return pdfData.text;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          const docxResult = await mammoth.extractRawText({ buffer });
          return docxResult.value;

        case 'text/plain':
          return buffer.toString('utf-8');

        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      logger.error('Failed to extract text:', error);
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  private async generateMetadata(text: string, filename: string): Promise<DocumentMetadata> {
    // Basic metadata extraction
    const wordCount = text.split(/\s+/).length;
    const pages = Math.ceil(wordCount / 250); // Estimate pages
    
    // Extract basic entities (simplified)
    const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
    const dates = text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g) || [];
    
    return {
      pages,
      language: 'en', // TODO: Add language detection
      keywords: await this.extractKeywords(text),
      entities: [...new Set([...emails, ...dates])],
      sentiment: await this.analyzeSentiment(text),
      category: this.categorizeDocument(filename, text)
    };
  }

  private async extractKeywords(text: string): Promise<string[]> {
    // Simple keyword extraction (in production, use more sophisticated NLP)
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private async analyzeSentiment(text: string): Promise<number> {
    // Simple sentiment analysis (in production, use ML model)
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'successful', 'beneficial'];
    const negativeWords = ['bad', 'terrible', 'negative', 'failed', 'problematic', 'concerning'];
    
    const words = text.toLowerCase().split(/\s+/);
    let sentiment = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) sentiment += 1;
      if (negativeWords.includes(word)) sentiment -= 1;
    });
    
    return Math.max(-1, Math.min(1, sentiment / words.length * 100));
  }

  private categorizeDocument(filename: string, text: string): string {
    const categories = {
      'contract': /contract|agreement|terms|conditions/i,
      'financial': /financial|revenue|profit|budget|invoice/i,
      'legal': /legal|court|lawsuit|litigation|counsel/i,
      'technical': /technical|specification|manual|guide/i,
      'report': /report|analysis|summary|findings/i
    };

    const filenameText = filename.toLowerCase();
    const contentText = text.toLowerCase();
    
    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(filenameText) || pattern.test(contentText)) {
        return category;
      }
    }
    
    return 'general';
  }

  private async generateSummary(text: string): Promise<string> {
    // Simple extractive summarization (in production, use LLM)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length <= 3) {
      return text.slice(0, 500) + '...';
    }
    
    // Take first, middle, and last sentences as summary
    const summary = [
      sentences[0],
      sentences[Math.floor(sentences.length / 2)],
      sentences[sentences.length - 1]
    ].join('. ').slice(0, 500) + '...';
    
    return summary;
  }

  private async generateAndStoreEmbeddings(
    documentId: string,
    text: string,
    deploymentId: string
  ): Promise<number[]> {
    try {
      // Chunk the text into smaller pieces
      const chunks = this.chunkText(text, 1000, 200);
      
      // Get or create collection for this deployment
      const collectionName = `deployment-${deploymentId}`;
      let collection;
      
      try {
        collection = await this.chromaClient.getCollection({ name: collectionName });
      } catch {
        collection = await this.chromaClient.createCollection({ name: collectionName });
      }

      // Generate embeddings and store in ChromaDB
      const ids = chunks.map((_, index) => `${documentId}-chunk-${index}`);
      const metadatas = chunks.map((chunk, index) => ({
        documentId,
        chunkIndex: index,
        chunkText: chunk.slice(0, 100) + '...'
      }));

      await collection.add({
        ids,
        documents: chunks,
        metadatas
      });

      // Return a summary embedding (just the first chunk's embedding for now)
      // In production, you'd want to compute a document-level embedding
      return new Array(384).fill(0).map(() => Math.random()); // Placeholder

    } catch (error) {
      logger.error('Failed to generate embeddings:', error);
      throw error;
    }
  }

  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start = end - overlap;
    }
    
    return chunks;
  }

  private async deleteFromChromaDB(documentId: string, deploymentId: string): Promise<void> {
    try {
      const collectionName = `deployment-${deploymentId}`;
      const collection = await this.chromaClient.getCollection({ name: collectionName });
      
      // Delete all chunks for this document
      const results = await collection.get({
        where: { documentId }
      });
      
      if (results.ids.length > 0) {
        await collection.delete({ ids: results.ids });
      }

    } catch (error) {
      logger.warn(`Failed to delete embeddings for document ${documentId}:`, error);
      // Don't throw error, just log warning
    }
  }

  private getProcessingProgress(status: DocumentStatus): number {
    const progressMap = {
      [DocumentStatus.UPLOADED]: 25,
      [DocumentStatus.PROCESSING]: 75,
      [DocumentStatus.PROCESSED]: 100,
      [DocumentStatus.FAILED]: 0
    };

    return progressMap[status] || 0;
  }
}