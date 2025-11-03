"""
Real OAuth Implementation for Google and GitHub
Replaces mock OAuth callback with actual provider integration
"""
import httpx
from typing import Dict, Optional
from datetime import datetime
from fastapi import HTTPException, status


class OAuthProvider:
    """Base OAuth provider"""
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
    
    async def exchange_code_for_token(self, code: str) -> Dict:
        """Exchange authorization code for access token"""
        raise NotImplementedError
    
    async def get_user_info(self, access_token: str) -> Dict:
        """Get user info from provider"""
        raise NotImplementedError


class GoogleOAuth(OAuthProvider):
    """Google OAuth 2.0 implementation"""
    
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
    
    async def exchange_code_for_token(self, code: str) -> Dict:
        """Exchange authorization code for access token"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.TOKEN_URL,
                    data={
                        "code": code,
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "redirect_uri": self.redirect_uri,
                        "grant_type": "authorization_code"
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to exchange code for token: {e.response.text}"
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"OAuth token exchange failed: {str(e)}"
                )
    
    async def get_user_info(self, access_token: str) -> Dict:
        """Get user info from Google"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    self.USER_INFO_URL,
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                response.raise_for_status()
                data = response.json()
                
                # Normalize to common format
                return {
                    "email": data.get("email"),
                    "name": data.get("name"),
                    "provider_id": data.get("id"),
                    "avatar": data.get("picture"),
                    "email_verified": data.get("verified_email", False)
                }
            except httpx.HTTPStatusError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to get user info: {e.response.text}"
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to fetch user info: {str(e)}"
                )


class GitHubOAuth(OAuthProvider):
    """GitHub OAuth implementation"""
    
    TOKEN_URL = "https://github.com/login/oauth/access_token"
    USER_INFO_URL = "https://api.github.com/user"
    USER_EMAIL_URL = "https://api.github.com/user/emails"
    
    async def exchange_code_for_token(self, code: str) -> Dict:
        """Exchange authorization code for access token"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.TOKEN_URL,
                    data={
                        "code": code,
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "redirect_uri": self.redirect_uri
                    },
                    headers={"Accept": "application/json"}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to exchange code for token: {e.response.text}"
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"OAuth token exchange failed: {str(e)}"
                )
    
    async def get_user_info(self, access_token: str) -> Dict:
        """Get user info from GitHub"""
        async with httpx.AsyncClient() as client:
            try:
                # Get user profile
                user_response = await client.get(
                    self.USER_INFO_URL,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Accept": "application/vnd.github+json"
                    }
                )
                user_response.raise_for_status()
                user_data = user_response.json()
                
                # Get primary email (GitHub may not include email in profile)
                email = user_data.get("email")
                email_verified = False
                
                if not email:
                    email_response = await client.get(
                        self.USER_EMAIL_URL,
                        headers={
                            "Authorization": f"Bearer {access_token}",
                            "Accept": "application/vnd.github+json"
                        }
                    )
                    email_response.raise_for_status()
                    emails = email_response.json()
                    
                    # Find primary verified email
                    primary_email = next(
                        (e for e in emails if e.get("primary") and e.get("verified")),
                        None
                    )
                    if primary_email:
                        email = primary_email["email"]
                        email_verified = True
                    elif emails:
                        # Fallback to first email
                        email = emails[0]["email"]
                        email_verified = emails[0].get("verified", False)
                
                # Normalize to common format
                return {
                    "email": email,
                    "name": user_data.get("name") or user_data.get("login"),
                    "provider_id": str(user_data.get("id")),
                    "avatar": user_data.get("avatar_url"),
                    "email_verified": email_verified
                }
            except httpx.HTTPStatusError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to get user info: {e.response.text}"
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to fetch user info: {str(e)}"
                )


async def get_oauth_user_info(
    provider: str,
    code: str,
    client_id: str,
    client_secret: str,
    redirect_uri: str
) -> Dict:
    """
    Get user info from OAuth provider
    
    Args:
        provider: 'google' or 'github'
        code: Authorization code from OAuth callback
        client_id: OAuth client ID
        client_secret: OAuth client secret
        redirect_uri: OAuth redirect URI
    
    Returns:
        Dict with normalized user info:
        {
            "email": str,
            "name": str,
            "provider_id": str,
            "avatar": str,
            "email_verified": bool
        }
    """
    # Select provider implementation
    if provider == "google":
        oauth = GoogleOAuth(client_id, client_secret, redirect_uri)
    elif provider == "github":
        oauth = GitHubOAuth(client_id, client_secret, redirect_uri)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OAuth provider: {provider}"
        )
    
    # Exchange code for token
    token_data = await oauth.exchange_code_for_token(code)
    access_token = token_data.get("access_token")
    
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to obtain access token from provider"
        )
    
    # Get user info
    user_info = await oauth.get_user_info(access_token)
    
    if not user_info.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider did not return user email"
        )
    
    return user_info
