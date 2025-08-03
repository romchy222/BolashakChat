import os
import logging
import mimetypes
from typing import Optional, List, Dict
import trafilatura
import requests
from datetime import datetime

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Processor for extracting text content from documents"""

    SUPPORTED_TYPES = {
        'text/plain': '.txt',
        'application/pdf': '.pdf',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'text/html': '.html'
    }

    def __init__(self, upload_folder: str = 'uploads'):
        self.upload_folder = upload_folder
        os.makedirs(upload_folder, exist_ok=True)

    def process_text_file(self, file_path: str) -> str:
        """Extract text from text files"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            try:
                with open(file_path, 'r', encoding='cp1251') as f:
                    return f.read()
            except Exception as e:
                logger.error(f"Error reading text file {file_path}: {str(e)}")
                return ""

    def process_html_file(self, file_path: str) -> str:
        """Extract text from HTML files"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            return trafilatura.extract(html_content) or ""
        except Exception as e:
            logger.error(f"Error processing HTML file {file_path}: {str(e)}")
            return ""

    def process_pdf_file(self, file_path: str) -> str:
        """Extract text from PDF files using PyPDF2"""
        try:
            import PyPDF2
            text = []
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text.append(page_text)
            return '\n'.join(text)
        except Exception as e:
            logger.error(f"Error processing PDF file {file_path}: {str(e)}")
            return ""

    def process_docx_file(self, file_path: str) -> str:
        """Extract text from DOCX files using python-docx"""
        try:
            import docx
            doc = docx.Document(file_path)
            return '\n'.join([para.text for para in doc.paragraphs])
        except Exception as e:
            logger.error(f"Error processing DOCX file {file_path}: {str(e)}")
            return ""

    def process_doc_file(self, file_path: str) -> str:
        """Extract text from DOC files using antiword (requires antiword installed)"""
        try:
            import subprocess
            result = subprocess.run(['antiword', file_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            return result.stdout.decode('utf-8', errors='ignore')
        except FileNotFoundError:
            logger.error("antiword is not installed. Please install it via 'apt install antiword'")
            return "[antiword не установлен: apt install antiword]"
        except Exception as e:
            logger.error(f"Error processing DOC file {file_path}: {str(e)}")
            return ""

    def process_document(self, file_path: str, file_type: str) -> str:
        """Process document and extract text content"""
        try:
            if file_type == 'text/plain':
                return self.process_text_file(file_path)
            elif file_type == 'text/html':
                return self.process_html_file(file_path)
            elif file_type == 'application/pdf':
                return self.process_pdf_file(file_path)
            elif file_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                return self.process_docx_file(file_path)
            elif file_type == 'application/msword':
                return self.process_doc_file(file_path)
            else:
                logger.warning(f"Unsupported file type: {file_type}")
                return f"[Неподдерживаемый тип файла: {file_type}]"
        except Exception as e:
            logger.error(f"Error processing document {file_path}: {str(e)}")
            return ""

    def save_uploaded_file(self, file, filename: str) -> tuple[str, int]:
        """Save uploaded file and return path and size"""
        try:
            file_path = os.path.join(self.upload_folder, filename)
            file.save(file_path)
            file_size = os.path.getsize(file_path)
            return file_path, file_size
        except Exception as e:
            logger.error(f"Error saving file {filename}: {str(e)}")
            raise

    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
        """Split text into chunks for knowledge base"""
        if not text or len(text) <= chunk_size:
            return [text] if text else []

        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size
            if end >= len(text):
                chunks.append(text[start:])
                break

            # Try to find a good break point (sentence end)
            chunk = text[start:end]
            last_period = chunk.rfind('.')
            last_newline = chunk.rfind('\n')
            break_point = max(last_period, last_newline)

            if break_point > start + chunk_size // 2:
                chunks.append(text[start:start + break_point + 1])
                start = start + break_point + 1 - overlap
            else:
                chunks.append(chunk)
                start = end - overlap

        return [chunk.strip() for chunk in chunks if chunk.strip()]

class WebScraper:
    """Scraper for extracting content from web sources"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'BolashakBot/1.0 (Educational Content Scraper)'
        })

    def scrape_url(self, url: str) -> Optional[str]:
        """Scrape content from URL"""
        try:
            logger.info(f"Scraping URL: {url}")

            # Download content
            downloaded = trafilatura.fetch_url(url)
            if not downloaded:
                logger.warning(f"Failed to download content from {url}")
                return None

            # Extract text
            text = trafilatura.extract(downloaded)
            if not text:
                logger.warning(f"Failed to extract text from {url}")
                return None

            logger.info(f"Successfully scraped {len(text)} characters from {url}")
            return text

        except Exception as e:
            logger.error(f"Error scraping URL {url}: {str(e)}")
            return None

    def validate_url(self, url: str) -> bool:
        """Validate if URL is accessible"""
        try:
            response = self.session.head(url, timeout=10, allow_redirects=True)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"URL validation failed for {url}: {str(e)}")
            return False

class KnowledgeBaseUpdater:
    """Updates knowledge base from various sources"""

    def __init__(self, db, models):
        self.db = db
        self.Document = models['Document']
        self.WebSource = models['WebSource']
        self.KnowledgeBase = models['KnowledgeBase']
        self.document_processor = DocumentProcessor()
        self.web_scraper = WebScraper()

    def update_from_document(self, document_id: int) -> bool:
        """Update knowledge base from document"""
        try:
            document = self.Document.query.get(document_id)
            if not document:
                logger.error(f"Document {document_id} not found")
                return False

            # Process document if not already processed
            if not document.is_processed:
                text_content = self.document_processor.process_document(
                    document.file_path, 
                    mimetypes.guess_type(document.filename)[0] or 'text/plain'
                )
                document.content_text = text_content
                document.is_processed = True
                self.db.session.commit()

            # Clear existing knowledge base entries for this document
            self.KnowledgeBase.query.filter_by(
                source_type='document', 
                source_id=document_id
            ).delete()

            # Create new chunks
            chunks = self.document_processor.chunk_text(document.content_text)
            for i, chunk in enumerate(chunks):
                kb_entry = self.KnowledgeBase(
                    source_type='document',
                    source_id=document_id,
                    content_chunk=chunk,
                    extra_data={'chunk_index': i, 'total_chunks': len(chunks)}
                )
                self.db.session.add(kb_entry)

            self.db.session.commit()
            logger.info(f"Updated knowledge base with {len(chunks)} chunks from document {document_id}")
            return True

        except Exception as e:
            logger.error(f"Error updating knowledge base from document {document_id}: {str(e)}")
            self.db.session.rollback()
            return False

    def update_from_web_source(self, web_source_id: int) -> bool:
        """Update knowledge base from web source"""
        try:
            web_source = self.WebSource.query.get(web_source_id)
            if not web_source:
                logger.error(f"Web source {web_source_id} not found")
                return False

            # Scrape content
            text_content = self.web_scraper.scrape_url(web_source.url)
            if not text_content:
                logger.error(f"Failed to scrape content from {web_source.url}")
                return False

            # Update web source
            web_source.content_text = text_content
            web_source.last_scraped = datetime.utcnow()

            # Clear existing knowledge base entries for this web source
            self.KnowledgeBase.query.filter_by(
                source_type='web', 
                source_id=web_source_id
            ).delete()

            # Create new chunks
            chunks = self.document_processor.chunk_text(text_content)
            for i, chunk in enumerate(chunks):
                kb_entry = self.KnowledgeBase(
                    source_type='web',
                    source_id=web_source_id,
                    content_chunk=chunk,
                    extra_data={'chunk_index': i, 'total_chunks': len(chunks), 'url': web_source.url}
                )
                self.db.session.add(kb_entry)

            self.db.session.commit()
            logger.info(f"Updated knowledge base with {len(chunks)} chunks from web source {web_source_id}")
            return True

        except Exception as e:
            logger.error(f"Error updating knowledge base from web source {web_source_id}: {str(e)}")
            self.db.session.rollback()
            return False

    def get_relevant_content(self, query: str, language: str = 'ru', limit: int = 5) -> List[str]:
        """Get relevant content from knowledge base"""
        try:
            query_lower = query.lower()
            keywords = [word for word in query_lower.split() if len(word) > 2]

            if not keywords:
                return []

            # Simple keyword matching - in production, use vector similarity
            relevant_entries = []

            for keyword in keywords[:3]:  # Limit to first 3 keywords
                entries = self.KnowledgeBase.query.filter(
                    self.KnowledgeBase.is_active == True,
                    self.KnowledgeBase.content_chunk.ilike(f'%{keyword}%')
                ).limit(limit).all()

                for entry in entries:
                    if entry not in relevant_entries:
                        relevant_entries.append(entry)

            return [entry.content_chunk for entry in relevant_entries[:limit]]

        except Exception as e:
            logger.error(f"Error getting relevant content: {str(e)}")
            return []