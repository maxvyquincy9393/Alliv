"""Fix Unicode characters in Python files for Windows compatibility"""
import os
import re

# Unicode replacements
replacements = {
    '✅': '[OK]',
    '❌': '[ERROR]',
    '⚠️': '[WARN]',
    '💡': '[TIP]',
    '🔄': '[SYNC]',
    '⏰': '[TIME]',
    '📧': '[EMAIL]',
    '🎯': '[TARGET]',
    '📊': '[STATS]',
    '🔍': '[SEARCH]',
    '🔒': '[LOCK]',
    '🔓': '[UNLOCK]',
    '🚀': '[LAUNCH]',
    '💾': '[SAVE]',
    '🗑️': '[DELETE]',
    '📝': '[NOTE]',
    '🎉': '[SUCCESS]',
    '⚡': '[FAST]',
    '🌍': '[GLOBAL]',
}

def fix_file(filepath):
    """Fix unicode characters in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        for unicode_char, ascii_char in replacements.items():
            content = content.replace(unicode_char, ascii_char)
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"[OK] Fixed: {filepath}")
            return True
        return False
    except Exception as e:
        print(f"[ERROR] Failed to fix {filepath}: {e}")
        return False

def fix_directory(directory):
    """Fix all Python files in directory"""
    fixed_count = 0
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                if fix_file(filepath):
                    fixed_count += 1
    return fixed_count

if __name__ == "__main__":
    import sys
    
    # Get directory from command line or use current
    directory = sys.argv[1] if len(sys.argv) > 1 else '.'
    
    print(f"\n[SYNC] Fixing Unicode characters in: {directory}\n")
    count = fix_directory(directory)
    print(f"\n[SUCCESS] Fixed {count} files!\n")
