"""Fix db imports in all router files"""
import os
import re

def fix_db_imports(filepath):
    """Fix db imports in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Fix import statement
        content = re.sub(r'from \.\.db import db\b', 'from ..db import get_db', content)
        
        # Fix all db.collection() calls to get_db().collection
        content = re.sub(r'\bdb\.users\(\)', 'get_db().users', content)
        content = re.sub(r'\bdb\.swipes\(\)', 'get_db().swipes', content)
        content = re.sub(r'\bdb\.matches\(\)', 'get_db().matches', content)
        content = re.sub(r'\bdb\.chats\(\)', 'get_db().chats', content)
        content = re.sub(r'\bdb\.messages\(\)', 'get_db().messages', content)
        content = re.sub(r'\bdb\.profiles\(\)', 'get_db().profiles', content)
        content = re.sub(r'\bdb\.projects\(\)', 'get_db().projects', content)
        content = re.sub(r'\bdb\.events\(\)', 'get_db().events', content)
        content = re.sub(r'\bdb\.verifications\(\)', 'get_db().verifications', content)
        content = re.sub(r'\bdb\.reports\(\)', 'get_db().reports', content)
        content = re.sub(r'\bdb\.blocks\(\)', 'get_db().blocks', content)
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"[OK] Fixed: {filepath}")
            return True
        return False
    except Exception as e:
        print(f"[ERROR] Failed to fix {filepath}: {e}")
        return False

if __name__ == "__main__":
    # Fix routers
    routers_dir = 'app/routers'
    if os.path.exists(routers_dir):
        for file in os.listdir(routers_dir):
            if file.endswith('.py'):
                filepath = os.path.join(routers_dir, file)
                fix_db_imports(filepath)
    
    # Fix routes
    routes_dir = 'app/routes'
    if os.path.exists(routes_dir):
        for file in os.listdir(routes_dir):
            if file.endswith('.py'):
                filepath = os.path.join(routes_dir, file)
                fix_db_imports(filepath)
    
    print("\n[SUCCESS] All db imports fixed!")
