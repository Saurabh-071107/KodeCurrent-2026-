"""SQLite-backed document metadata storage."""
import aiosqlite
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass

from app.config import get_settings

logger = __import__("structlog").get_logger(__name__)


@dataclass
class DocumentRecord:
    """Document metadata record."""
    id: str
    filename: str
    file_type: str
    file_size: int
    upload_timestamp: datetime
    extraction_status: str  # pending, processing, completed, failed
    extraction_error: Optional[str]
    metadata: Dict[str, Any]
    chunk_count: int = 0


class DocumentStore:
    """SQLite-based document metadata store."""

    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            settings = get_settings()
            upload_dir = Path(settings.document.upload_dir)
            upload_dir.mkdir(parents=True, exist_ok=True)
            db_path = str(upload_dir / "documents.db")
        self.db_path = db_path

    async def initialize(self):
        """Create tables if they don't exist."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    file_type TEXT NOT NULL,
                    file_size INTEGER NOT NULL,
                    upload_timestamp TEXT NOT NULL,
                    extraction_status TEXT NOT NULL,
                    extraction_error TEXT,
                    metadata TEXT NOT NULL,
                    chunk_count INTEGER DEFAULT 0
                )
            """)
            await db.execute("""
                CREATE INDEX IF NOT EXISTS idx_documents_status 
                ON documents(extraction_status)
            """)
            await db.execute("""
                CREATE INDEX IF NOT EXISTS idx_documents_timestamp 
                ON documents(upload_timestamp)
            """)
            await db.commit()

    async def create(self, record: DocumentRecord) -> None:
        """Insert a new document record."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT INTO documents (id, filename, file_type, file_size, upload_timestamp, 
                                     extraction_status, extraction_error, metadata, chunk_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record.id,
                    record.filename,
                    record.file_type,
                    record.file_size,
                    record.upload_timestamp.isoformat(),
                    record.extraction_status,
                    record.extraction_error,
                    json.dumps(record.metadata),
                    record.chunk_count,
                ),
            )
            await db.commit()

    async def get(self, document_id: str) -> Optional[DocumentRecord]:
        """Get a document by ID."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM documents WHERE id = ?", (document_id,)
            )
            row = await cursor.fetchone()
            if row is None:
                return None
            return self._row_to_record(row)

    async def list(
        self, limit: int = 100, offset: int = 0, status: Optional[str] = None
    ) -> List[DocumentRecord]:
        """List documents with optional filtering."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            query = "SELECT * FROM documents"
            params = []
            if status:
                query += " WHERE extraction_status = ?"
                params.append(status)
            query += " ORDER BY upload_timestamp DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            cursor = await db.execute(query, params)
            rows = await cursor.fetchall()
            return [self._row_to_record(row) for row in rows]

    async def update_status(
        self, document_id: str, status: str, error: Optional[str] = None, chunk_count: int = 0
    ) -> None:
        """Update extraction status."""
        async with aiosqlite.connect(self.db_path) as db:
            if error is not None:
                await db.execute(
                    "UPDATE documents SET extraction_status = ?, extraction_error = ?, chunk_count = ? WHERE id = ?",
                    (status, error, chunk_count, document_id),
                )
            else:
                await db.execute(
                    "UPDATE documents SET extraction_status = ?, chunk_count = ? WHERE id = ?",
                    (status, chunk_count, document_id),
                )
            await db.commit()

    async def update_metadata(self, document_id: str, metadata: Dict[str, Any]) -> None:
        """Update document metadata."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "UPDATE documents SET metadata = ? WHERE id = ?",
                (json.dumps(metadata), document_id),
            )
            await db.commit()

    async def delete(self, document_id: str) -> bool:
        """Delete a document record. Returns True if deleted."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                "DELETE FROM documents WHERE id = ?", (document_id,)
            )
            await db.commit()
            return cursor.rowcount > 0

    async def count(self, status: Optional[str] = None) -> int:
        """Count documents."""
        async with aiosqlite.connect(self.db_path) as db:
            if status:
                cursor = await db.execute(
                    "SELECT COUNT(*) FROM documents WHERE extraction_status = ?", (status,)
                )
            else:
                cursor = await db.execute("SELECT COUNT(*) FROM documents")
            row = await cursor.fetchone()
            return row[0] if row else 0

    def _row_to_record(self, row: aiosqlite.Row) -> DocumentRecord:
        """Convert SQLite row to DocumentRecord."""
        return DocumentRecord(
            id=row["id"],
            filename=row["filename"],
            file_type=row["file_type"],
            file_size=row["file_size"],
            upload_timestamp=datetime.fromisoformat(row["upload_timestamp"]),
            extraction_status=row["extraction_status"],
            extraction_error=row["extraction_error"],
            metadata=json.loads(row["metadata"]),
            chunk_count=row["chunk_count"],
        )


# Global store instance
_store: Optional[DocumentStore] = None


def get_document_store() -> DocumentStore:
    """Get global document store instance."""
    global _store
    if _store is None:
        _store = DocumentStore()
    return _store


async def initialize_document_store():
    """Initialize the document store."""
    store = get_document_store()
    await store.initialize()