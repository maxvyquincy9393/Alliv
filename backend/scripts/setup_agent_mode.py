#!/usr/bin/env python3
"""
Agent Security Setup Script
Configures the backend to run in agent-safe mode with database access restrictions
"""

import os
import sys
import json
import logging
from typing import Dict, Any
from pathlib import Path
import pymongo
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AgentSecuritySetup:
    """Configure agent security controls to prevent database access"""
    
    def __init__(self, config_path: str = "app/config.py"):
        self.config_path = Path(config_path)
        self.backup_path = Path(f"{config_path}.backup")
        self.agent_config = {
            "AGENT_MODE": "mock",
            "AGENT_DB_ACCESS": False,
            "AGENT_READ_ONLY": True,
            "AGENT_ALLOWED_ENDPOINTS": [
                "/api/public/*",
                "/api/search/*",
                "/api/info/*"
            ],
            "AGENT_BLOCKED_OPERATIONS": [
                "CREATE",
                "UPDATE",
                "DELETE",
                "DROP",
                "ALTER",
                "TRUNCATE"
            ]
        }
        
    def create_agent_user(self) -> Dict[str, Any]:
        """Create a restricted MongoDB user for agents"""
        try:
            # Connect to MongoDB admin
            client = pymongo.MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017/"))
            db = client.admin
            
            # Create agent user with no permissions
            agent_user = {
                "user": "agent_readonly",
                "pwd": os.getenv("AGENT_DB_PASSWORD", "dummy_password_no_access"),
                "roles": [
                    {
                        "role": "read",
                        "db": "colabmatch"
                    }
                ],
                "mechanisms": ["SCRAM-SHA-256"],
                "customData": {
                    "description": "Restricted agent user with read-only access",
                    "created_at": datetime.utcnow().isoformat(),
                    "restrictions": {
                        "no_write": True,
                        "no_admin": True,
                        "no_system_collections": True
                    }
                }
            }
            
            # Drop existing agent user if exists
            try:
                db.command("dropUser", "agent_readonly")
                logger.info("Dropped existing agent user")
            except:
                pass
            
            # Create new agent user
            db.command("createUser", agent_user["user"], 
                      pwd=agent_user["pwd"],
                      roles=agent_user["roles"])
            
            logger.info("Created restricted agent database user")
            return {
                "username": agent_user["user"],
                "connection_string": f"mongodb://agent_readonly:dummy_password_no_access@localhost:27017/colabmatch?authSource=admin"
            }
            
        except Exception as e:
            logger.error(f"Failed to create agent user: {e}")
            return {
                "username": "agent_mock",
                "connection_string": "mongodb://mock:mock@localhost:27017/mock"
            }
    
    def setup_firewall_rules(self):
        """Configure firewall rules to block agent access to database ports"""
        firewall_rules = [
            # Block MongoDB port for agent IPs
            "iptables -A INPUT -p tcp --dport 27017 -s 10.0.1.0/24 -j DROP",
            # Block PostgreSQL port for agent IPs  
            "iptables -A INPUT -p tcp --dport 5432 -s 10.0.1.0/24 -j DROP",
            # Block Redis port for agent IPs
            "iptables -A INPUT -p tcp --dport 6379 -s 10.0.1.0/24 -j DROP",
            # Allow only API gateway access
            "iptables -A INPUT -p tcp --dport 8000 -s 10.0.1.0/24 -j ACCEPT"
        ]
        
        logger.info("Firewall rules for agent isolation:")
        for rule in firewall_rules:
            logger.info(f"  {rule}")
        
        # Note: Actual implementation would execute these rules
        # This is for demonstration purposes
        
    def create_mock_database(self):
        """Create a mock database connection for agents"""
        mock_db = {
            "type": "mock",
            "responses": {
                "users": [
                    {"id": "mock_1", "name": "Mock User 1", "role": "Developer"},
                    {"id": "mock_2", "name": "Mock User 2", "role": "Designer"}
                ],
                "projects": [
                    {"id": "mock_p1", "name": "Mock Project", "status": "active"}
                ],
                "default": {
                    "message": "This is mock data for agent testing",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        }
        
        # Save mock database configuration
        mock_db_path = Path("app/mock_db_agent.json")
        with open(mock_db_path, "w") as f:
            json.dump(mock_db, f, indent=2)
        
        logger.info(f"Created mock database at {mock_db_path}")
        return mock_db_path
    
    def update_config(self):
        """Update application config for agent mode"""
        # Backup existing config
        if self.config_path.exists():
            import shutil
            shutil.copy(self.config_path, self.backup_path)
            logger.info(f"Backed up config to {self.backup_path}")
        
        # Create agent config
        agent_config_content = f"""
# Agent Mode Configuration
import os
from datetime import timedelta

class AgentConfig:
    '''Configuration for agent-safe mode'''
    
    # Agent Mode Settings
    AGENT_MODE = os.getenv('AGENT_MODE', 'mock')
    AGENT_DB_ACCESS = False
    AGENT_READ_ONLY = True
    
    # Database Configuration for Agents
    if AGENT_MODE == 'mock':
        MONGODB_URI = 'mongodb://mock:mock@localhost:27017/mock'
        DATABASE_NAME = 'mock_database'
    else:
        MONGODB_URI = 'mongodb://agent_readonly:dummy@localhost:27017/colabmatch?authSource=admin'
        DATABASE_NAME = 'colabmatch_readonly'
    
    # Restricted Endpoints
    AGENT_ALLOWED_ENDPOINTS = {json.dumps(self.agent_config['AGENT_ALLOWED_ENDPOINTS'], indent=8)}
    
    # Blocked Operations
    AGENT_BLOCKED_OPERATIONS = {json.dumps(self.agent_config['AGENT_BLOCKED_OPERATIONS'], indent=8)}
    
    # Request Limits for Agents
    AGENT_RATE_LIMIT = 100  # requests per minute
    AGENT_TIMEOUT = 30  # seconds
    AGENT_MAX_PAYLOAD = 1024 * 1024  # 1MB
    
    # Logging
    AGENT_LOG_ALL_REQUESTS = True
    AGENT_ALERT_ON_VIOLATION = True
    AGENT_ALERT_WEBHOOK = os.getenv('AGENT_ALERT_WEBHOOK', '')
    
    @classmethod
    def validate_agent_request(cls, request):
        '''Validate if agent request is allowed'''
        if cls.AGENT_MODE == 'disabled':
            return False
            
        # Check endpoint
        if not any(request.path.startswith(ep.replace('*', '')) 
                  for ep in cls.AGENT_ALLOWED_ENDPOINTS):
            return False
            
        # Check method
        if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            return False
            
        return True
    
    @classmethod
    def get_mock_response(cls, endpoint):
        '''Return mock data for agent requests'''
        import json
        with open('app/mock_db_agent.json', 'r') as f:
            mock_data = json.load(f)
        
        if 'users' in endpoint:
            return mock_data['responses']['users']
        elif 'projects' in endpoint:
            return mock_data['responses']['projects']
        else:
            return mock_data['responses']['default']

# Export config
agent_config = AgentConfig()
"""
        
        # Write agent config
        agent_config_path = Path("app/agent_config.py")
        with open(agent_config_path, "w") as f:
            f.write(agent_config_content)
        
        logger.info(f"Created agent config at {agent_config_path}")
        
    def create_monitoring_script(self):
        """Create script to monitor agent database access attempts"""
        monitoring_script = '''
#!/usr/bin/env python3
"""Agent Database Access Monitor"""

import time
import logging
from datetime import datetime
import pymongo
from pymongo import monitoring

class AgentAccessMonitor(monitoring.CommandListener):
    def __init__(self):
        self.violations = []
        self.logger = logging.getLogger(__name__)
        
    def started(self, event):
        # Check if this is an agent connection
        if 'agent' in str(event.connection_id).lower():
            # Check for write operations
            if event.command_name in ['insert', 'update', 'delete', 'drop']:
                violation = {
                    'timestamp': datetime.utcnow(),
                    'operation': event.command_name,
                    'database': event.database_name,
                    'connection': str(event.connection_id),
                    'command': str(event.command)[:200]
                }
                self.violations.append(violation)
                self.logger.error(f"SECURITY VIOLATION: Agent attempted {event.command_name} on {event.database_name}")
                self.send_alert(violation)
    
    def send_alert(self, violation):
        """Send security alert"""
        import requests
        webhook_url = os.getenv('SECURITY_WEBHOOK')
        if webhook_url:
            try:
                requests.post(webhook_url, json={
                    'text': f'🚨 Security Alert: Agent DB Access Violation',
                    'violation': violation
                })
            except:
                pass
    
    def succeeded(self, event):
        pass
    
    def failed(self, event):
        pass

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    # Set up monitoring
    monitor = AgentAccessMonitor()
    monitoring.register(monitor)
    
    # Connect to MongoDB with monitoring
    client = pymongo.MongoClient(
        os.getenv('MONGODB_URI'),
        event_listeners=[monitor]
    )
    
    logger.info("Agent access monitoring started...")
    
    # Keep monitoring
    while True:
        time.sleep(60)
        if monitor.violations:
            logger.warning(f"Total violations detected: {len(monitor.violations)}")
'''
        
        monitor_path = Path("scripts/monitor_agent_access.py")
        monitor_path.parent.mkdir(exist_ok=True)
        with open(monitor_path, "w") as f:
            f.write(monitoring_script)
        
        os.chmod(monitor_path, 0o755)
        logger.info(f"Created monitoring script at {monitor_path}")
        
    def create_proxy_endpoint(self):
        """Create proxy endpoint for agent requests"""
        proxy_code = '''
from fastapi import APIRouter, Request, HTTPException
from typing import Any, Dict
import logging
from app.agent_config import agent_config

router = APIRouter(prefix="/api/agent", tags=["agent"])
logger = logging.getLogger(__name__)

@router.get("/info")
async def agent_info():
    """Get agent configuration info"""
    return {
        "mode": agent_config.AGENT_MODE,
        "read_only": agent_config.AGENT_READ_ONLY,
        "allowed_endpoints": agent_config.AGENT_ALLOWED_ENDPOINTS
    }

@router.get("/data/{resource}")
async def agent_get_data(resource: str, request: Request):
    """Proxy endpoint for agent data requests"""
    
    # Validate agent request
    if not agent_config.validate_agent_request(request):
        logger.warning(f"Blocked agent request to {resource}")
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Log agent request
    if agent_config.AGENT_LOG_ALL_REQUESTS:
        logger.info(f"Agent request: {request.method} {resource}")
    
    # Return mock data
    if agent_config.AGENT_MODE == "mock":
        return agent_config.get_mock_response(resource)
    
    # In production, would proxy to actual API with restrictions
    raise HTTPException(status_code=501, detail="Not implemented")

@router.post("/validate")
async def validate_agent_access(request: Request):
    """Validate if agent has proper access"""
    return {
        "valid": agent_config.validate_agent_request(request),
        "mode": agent_config.AGENT_MODE
    }
'''
        
        proxy_path = Path("app/routers/agent_proxy.py")
        with open(proxy_path, "w") as f:
            f.write(proxy_code)
        
        logger.info(f"Created proxy endpoint at {proxy_path}")
        
    def run(self):
        """Execute all security setup steps"""
        logger.info("Starting agent security setup...")
        
        # 1. Create restricted database user
        db_info = self.create_agent_user()
        logger.info(f"Database user: {db_info['username']}")
        
        # 2. Set up firewall rules
        self.setup_firewall_rules()
        
        # 3. Create mock database
        mock_db_path = self.create_mock_database()
        
        # 4. Update configuration
        self.update_config()
        
        # 5. Create monitoring script
        self.create_monitoring_script()
        
        # 6. Create proxy endpoint
        self.create_proxy_endpoint()
        
        # Set environment variables
        env_vars = {
            "AGENT_MODE": "mock",
            "AGENT_DB_CONNECTION": db_info["connection_string"],
            "AGENT_MONITORING": "enabled",
            "AGENT_MOCK_DB": str(mock_db_path)
        }
        
        logger.info("\n=== Agent Security Configuration Complete ===")
        logger.info("Environment variables to set:")
        for key, value in env_vars.items():
            logger.info(f"  export {key}='{value}'")
        
        logger.info("\nTo start monitoring:")
        logger.info("  python scripts/monitor_agent_access.py &")
        
        logger.info("\nTo test agent mode:")
        logger.info("  curl http://localhost:8000/api/agent/info")
        
        return env_vars

if __name__ == "__main__":
    setup = AgentSecuritySetup()
    setup.run()






