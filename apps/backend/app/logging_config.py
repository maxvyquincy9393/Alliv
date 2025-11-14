"""
Structured JSON Logging for Production
"""
import logging
import json
from datetime import datetime
from typing import Any, Dict
import sys


class JSONFormatter(logging.Formatter):
    """
    Custom JSON formatter for structured logging
    """
    
    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        
        # Add custom fields from extra parameter
        if hasattr(record, 'user_id'):
            log_obj['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_obj['request_id'] = record.request_id
        if hasattr(record, 'ip_address'):
            log_obj['ip_address'] = record.ip_address
        if hasattr(record, 'user_agent'):
            log_obj['user_agent'] = record.user_agent
        if hasattr(record, 'endpoint'):
            log_obj['endpoint'] = record.endpoint
        if hasattr(record, 'method'):
            log_obj['method'] = record.method
        if hasattr(record, 'status_code'):
            log_obj['status_code'] = record.status_code
        if hasattr(record, 'duration_ms'):
            log_obj['duration_ms'] = record.duration_ms
        if hasattr(record, 'error_type'):
            log_obj['error_type'] = record.error_type
            
        return json.dumps(log_obj)


def setup_logging(
    level: str = "INFO",
    use_json: bool = True,
    log_file: str = None
) -> logging.Logger:
    """
    Setup application logging
    
    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        use_json: Whether to use JSON formatting
        log_file: Optional file path for file logging
    
    Returns:
        Configured logger instance
    """
    # Create root logger
    logger = logging.getLogger("alliv")
    logger.setLevel(getattr(logging, level.upper()))
    
    # Remove existing handlers
    logger.handlers = []
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    
    if use_json:
        console_handler.setFormatter(JSONFormatter())
    else:
        console_handler.setFormatter(
            logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
        )
    
    logger.addHandler(console_handler)
    
    # Optional file handler
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(JSONFormatter())
        logger.addHandler(file_handler)
    
    return logger


# Usage example:
"""
from app.logging_config import setup_logging

# In main.py startup
logger = setup_logging(
    level="INFO",
    use_json=settings.NODE_ENV == "production",
    log_file="logs/app.log" if settings.NODE_ENV == "production" else None
)

# Usage in routes
logger.info("User registered", extra={
    'user_id': str(user_id),
    'email': user_email,
    'ip_address': request.client.host,
    'user_agent': request.headers.get('user-agent')
})

logger.error("Database connection failed", extra={
    'error_type': 'DatabaseError',
    'endpoint': request.url.path,
    'method': request.method
}, exc_info=True)
"""
