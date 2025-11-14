"""
Database read replica configuration.

Provides utilities for:
- Read/write splitting
- Read replica connection management
- Query routing
"""
import logging
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorClient
from ..config_validated import settings

logger = logging.getLogger(__name__)


class DatabaseConfig:
    """Database configuration with read replica support."""
    
    def __init__(self):
        """Initialize database configuration."""
        self.primary_uri = settings.MONGO_URI
        self.read_replicas = self._parse_read_replicas()
        self.primary_client: Optional[AsyncIOMotorClient] = None
        self.read_clients: List[AsyncIOMotorClient] = []
        self.current_read_index = 0
    
    def _parse_read_replicas(self) -> List[str]:
        """
        Parse read replica URIs from configuration.
        
        Returns:
            List of read replica URIs
        """
        # In production, read from environment variable
        replicas_str = getattr(settings, 'MONGO_READ_REPLICAS', '')
        if not replicas_str:
            return []
        
        return [uri.strip() for uri in replicas_str.split(',') if uri.strip()]
    
    async def connect_primary(self) -> AsyncIOMotorClient:
        """
        Connect to primary database.
        
        Returns:
            Primary database client
        """
        if not self.primary_client:
            self.primary_client = AsyncIOMotorClient(
                self.primary_uri,
                serverSelectionTimeoutMS=5000
            )
            logger.info("Connected to primary database")
        
        return self.primary_client
    
    async def connect_read_replicas(self) -> List[AsyncIOMotorClient]:
        """
        Connect to read replicas.
        
        Returns:
            List of read replica clients
        """
        if not self.read_replicas:
            logger.info("No read replicas configured, using primary for reads")
            return []
        
        if not self.read_clients:
            for replica_uri in self.read_replicas:
                try:
                    client = AsyncIOMotorClient(
                        replica_uri,
                        serverSelectionTimeoutMS=5000,
                        readPreference='secondaryPreferred'
                    )
                    self.read_clients.append(client)
                    logger.info(f"Connected to read replica")
                except Exception as e:
                    logger.error(f"Failed to connect to read replica: {e}")
        
        return self.read_clients
    
    def get_write_client(self) -> AsyncIOMotorClient:
        """
        Get client for write operations.
        
        Returns:
            Primary database client
        """
        if not self.primary_client:
            raise RuntimeError("Primary database not connected")
        
        return self.primary_client
    
    def get_read_client(self) -> AsyncIOMotorClient:
        """
        Get client for read operations (round-robin).
        
        Returns:
            Read replica client or primary if no replicas
        """
        if not self.read_clients:
            # Fall back to primary if no replicas
            return self.get_write_client()
        
        # Round-robin selection
        client = self.read_clients[self.current_read_index]
        self.current_read_index = (self.current_read_index + 1) % len(self.read_clients)
        
        return client
    
    async def close_all(self):
        """Close all database connections."""
        if self.primary_client:
            self.primary_client.close()
            logger.info("Closed primary database connection")
        
        for client in self.read_clients:
            client.close()
        
        if self.read_clients:
            logger.info(f"Closed {len(self.read_clients)} read replica connections")
        
        self.read_clients = []


# Global database config instance
db_config = DatabaseConfig()


async def get_db_for_read():
    """
    Get database connection for read operations.
    
    Returns:
        Database client optimized for reads
    """
    client = db_config.get_read_client()
    return client[settings.MONGO_URI.split('/')[-1].split('?')[0]]


async def get_db_for_write():
    """
    Get database connection for write operations.
    
    Returns:
        Primary database client
    """
    client = db_config.get_write_client()
    return client[settings.MONGO_URI.split('/')[-1].split('?')[0]]
