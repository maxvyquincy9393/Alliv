# Contributing to COLABMATCH

Thank you for your interest in contributing to COLABMATCH! 🎉

This document provides guidelines and instructions for contributing to this project.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

---

## 📜 Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

**Expected Behavior:**
- Be kind and courteous
- Respect differing viewpoints
- Provide constructive feedback
- Focus on what's best for the community

**Unacceptable Behavior:**
- Harassment or discriminatory language
- Trolling or insulting comments
- Personal or political attacks
- Publishing private information

---

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/colabmatch.git
cd colabmatch
```

### 2. Setup Development Environment

#### Backend Setup:
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-test.txt

# Setup environment
cp ../env.example .env
# Edit .env with your configuration

# Generate secrets
python generate_secrets.py
```

#### Frontend Setup:
```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp env.example .env
# Edit .env with your configuration
```

### 3. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:socket_app --reload --port 8080

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 🔄 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, maintainable code
- Follow the coding standards (see below)
- Add tests for new features
- Update documentation as needed

### 3. Test Your Changes

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
npm run test:e2e
```

### 4. Lint Your Code

```bash
# Backend
cd backend
black .
ruff check .
flake8

# Frontend
cd frontend
npm run lint
npm run format
```

### 5. Commit Your Changes

```bash
git add .
git commit -m "feat: add amazing feature"
```

See [Commit Convention](#commit-convention) for details.

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## 📝 Coding Standards

### Backend (Python)

#### Style Guide:
- Follow **PEP 8** guidelines
- Use **Black** for formatting (line length: 120)
- Use **type hints** where appropriate
- Write **docstrings** for functions and classes

#### Example:
```python
from typing import Optional, List
from pydantic import BaseModel


class User(BaseModel):
    """User model with validation"""
    id: str
    email: str
    name: Optional[str] = None


async def get_user_by_id(user_id: str) -> Optional[User]:
    """
    Fetch user by ID
    
    Args:
        user_id: The user's unique identifier
        
    Returns:
        User object if found, None otherwise
        
    Raises:
        ValueError: If user_id is invalid
    """
    # Implementation here
    pass
```

#### Best Practices:
- ✅ Use async/await for I/O operations
- ✅ Validate inputs with Pydantic
- ✅ Handle errors gracefully
- ✅ Use dependency injection
- ✅ Write unit tests for business logic
- ✅ Keep functions focused and small

### Frontend (TypeScript/React)

#### Style Guide:
- Follow **ESLint** rules
- Use **Prettier** for formatting
- Use **TypeScript** for type safety
- Write **functional components** with hooks

#### Example:
```typescript
import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  userId, 
  onUpdate 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};
```

#### Best Practices:
- ✅ Use React hooks (useState, useEffect, etc.)
- ✅ Implement proper error handling
- ✅ Use TypeScript interfaces/types
- ✅ Keep components focused and reusable
- ✅ Use React Query for data fetching
- ✅ Write tests with React Testing Library

---

## 🏷️ Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types:
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no code change)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (build, dependencies)
- **perf**: Performance improvements
- **ci**: CI/CD changes

### Examples:

```bash
# Simple feature
git commit -m "feat: add user profile editing"

# Bug fix with scope
git commit -m "fix(auth): resolve token expiration issue"

# Breaking change
git commit -m "feat!: redesign authentication flow

BREAKING CHANGE: Old auth tokens are no longer valid"

# With body and footer
git commit -m "feat(chat): implement real-time notifications

- Add WebSocket connection for notifications
- Update UI to show unread count
- Add notification sound

Closes #123"
```

### Commit Message Guidelines:
- ✅ Use imperative mood ("add" not "added")
- ✅ Keep subject line under 72 characters
- ✅ Capitalize first letter
- ✅ No period at the end of subject
- ✅ Reference issues in footer

---

## 🔄 Pull Request Process

### 1. Before Submitting

- [ ] Code builds without errors
- [ ] All tests pass
- [ ] Code is linted and formatted
- [ ] New tests added for new features
- [ ] Documentation updated (if needed)
- [ ] No merge conflicts with main branch

### 2. PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No new warnings
```

### 3. Review Process

1. **Automated Checks**: CI/CD pipeline must pass
2. **Code Review**: At least one maintainer approval required
3. **Changes**: Address review comments
4. **Merge**: Maintainer will merge when approved

### 4. After Merge

- Delete your feature branch
- Pull latest main branch
- Your contribution will be in the next release! 🎉

---

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Run all tests
pytest

# Run specific test file
pytest tests/unit/test_auth.py

# Run with coverage
pytest --cov=app --cov-report=html

# Run only unit tests
pytest tests/unit/

# Run only integration tests
pytest tests/integration/
```

### Frontend Testing

```bash
cd frontend

# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e

# Run E2E in UI mode
npm run test:e2e -- --ui
```

### Writing Tests

#### Backend Example:
```python
import pytest
from app.auth import create_access_token, verify_token

@pytest.mark.unit
def test_create_access_token():
    """Test JWT token creation"""
    token = create_access_token(user_id="123")
    assert token is not None
    assert len(token) > 0

@pytest.mark.unit
def test_verify_valid_token():
    """Test token verification with valid token"""
    token = create_access_token(user_id="123")
    payload = verify_token(token)
    assert payload["user_id"] == "123"
```

#### Frontend Example:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  it('renders user name', () => {
    render(<UserProfile userId="123" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('handles edit button click', () => {
    const onUpdate = jest.fn();
    render(<UserProfile userId="123" onUpdate={onUpdate} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(onUpdate).toHaveBeenCalled();
  });
});
```

---

## 📚 Documentation

### When to Update Documentation:

- ✅ Adding new features
- ✅ Changing API endpoints
- ✅ Updating configuration options
- ✅ Modifying deployment process
- ✅ Changing environment variables

### Documentation Files:
- `README.md` - Main project documentation
- `SECURITY.md` - Security guidelines
- `CONTRIBUTING.md` - This file
- API docs - Auto-generated from code (FastAPI/Swagger)

### Code Comments:
- Write comments for complex logic
- Use docstrings for functions/classes
- Keep comments up to date
- Avoid obvious comments

---

## 🎯 Good First Issues

Looking for something to work on? Check issues labeled:
- `good first issue` - Great for beginners
- `help wanted` - Community help needed
- `documentation` - Documentation improvements

---

## 💡 Questions?

- **General Questions**: Open a GitHub Discussion
- **Bug Reports**: Open a GitHub Issue
- **Feature Requests**: Open a GitHub Issue with "Feature Request" label
- **Security Issues**: Email security@alliv.app

---

## 🙏 Thank You!

Every contribution, no matter how small, is valued and appreciated. Thank you for helping make COLABMATCH better!

---

**Happy Coding! 🚀**






