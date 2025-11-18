"""
Email utility - Send emails via SMTP
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging
from urllib.parse import urlparse

from .config import settings

logger = logging.getLogger("alliv")

DEFAULT_FRONTEND_URL = "http://localhost:3000"


def _get_frontend_base_url() -> str:
    """Return the configured frontend base URL with a safe fallback."""
    base_url = getattr(settings, "FRONTEND_URL", DEFAULT_FRONTEND_URL) or DEFAULT_FRONTEND_URL
    base_url = base_url.rstrip("/")
    return base_url or DEFAULT_FRONTEND_URL


def _normalize_code(code: Optional[str]) -> str:
    """Strip whitespace from the verification/reset code."""
    if not code:
        return ""
    return "".join(str(code).split())


def _format_code_for_display(code: str) -> str:
    """Format a code into groups of three characters for readability."""
    if not code:
        return ""
    return " ".join(code[i:i + 3] for i in range(0, len(code), 3)).strip()


def _build_action_link(provided_link: Optional[str], fallback_path: str, verification_code: str) -> str:
    """
    Build a safe magic link for verification/reset actions when callers don't provide one.
    """
    if provided_link:
        return provided_link
    
    base_url = _get_frontend_base_url()
    path = fallback_path if fallback_path.startswith("/") else f"/{fallback_path}"
    link = f"{base_url}{path}"
    
    if verification_code:
        separator = "&" if "?" in link else "?"
        return f"{link}{separator}code={verification_code}"
    return link


def parse_smtp_url(smtp_url: str) -> dict:
    """
    Parse SMTP URL into connection parameters
    Format: smtp://username:password@host:port
    """
    parsed = urlparse(smtp_url)
    return {
        "hostname": parsed.hostname,
        "port": parsed.port or 587,
        "username": parsed.username,
        "password": parsed.password,
        "start_tls": True,  # Use STARTTLS (not direct TLS)
        "use_tls": False    # Don't use direct TLS connection
    }


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    """
    Send email via SMTP
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML email body
        text_content: Plain text fallback (optional)
    
    Returns:
        True if sent successfully, False otherwise
    """
    if not settings.SMTP_URL:
        logger.warning("SMTP_URL not configured - using development fallback")
        # Development fallback: Log email to console instead of sending
        print("\n" + "="*50)
        print(f"📧 MOCK EMAIL TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print("-" * 50)
        print(text_content or "No text content")
        print("="*50 + "\n")
        return True
    
    try:
        # Parse SMTP connection details
        smtp_config = parse_smtp_url(settings.SMTP_URL)
        
        # Create message
        message = MIMEMultipart("alternative")
        message["From"] = settings.EMAIL_FROM
        message["To"] = to_email
        message["Subject"] = subject
        
        # Add text part (fallback)
        if text_content:
            text_part = MIMEText(text_content, "plain")
            message.attach(text_part)
        
        # Add HTML part
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Send email
        await aiosmtplib.send(
            message,
            hostname=smtp_config["hostname"],
            port=smtp_config["port"],
            username=smtp_config["username"],
            password=smtp_config["password"],
            start_tls=smtp_config["start_tls"],
            use_tls=smtp_config["use_tls"]
        )
        
        logger.info(f"[OK] Email sent to {to_email}: {subject}")
        return True
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to send email to {to_email}: {e}")
        return False


async def send_verification_email(
    to_email: str,
    user_name: str,
    verification_code: Optional[str],
    verification_link: Optional[str] = None,
) -> bool:
    """
    Send email verification email with OTP and magic link.
    When verification_code is missing we bail out early to avoid sending an
    unusable email.
    """
    normalized_code = _normalize_code(verification_code)
    if not normalized_code:
        logger.warning("send_verification_email called without verification_code - skipping send")
        return False
    
    subject = "Alliv — Verify your email"
    formatted_code = _format_code_for_display(normalized_code)
    action_link = _build_action_link(verification_link, "/verify-email", normalized_code)
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                margin: 0;
                padding: 0;
                background-color: #f9fafb;
            }}
            .container {{ 
                max-width: 600px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }}
            .header {{ 
                background: #000;
                padding: 32px 24px;
                text-align: center;
            }}
            .logo {{ 
                font-size: 32px;
                font-weight: 700;
                color: #fff;
                margin: 0;
            }}
            .content {{ 
                padding: 40px 24px;
            }}
            .greeting {{
                font-size: 20px;
                font-weight: 600;
                margin: 0 0 16px 0;
                color: #000;
            }}
            .text {{
                font-size: 16px;
                color: #6b7280;
                margin: 0 0 24px 0;
            }}
            .code-section {{
                background: #f9fafb;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 24px;
                text-align: center;
                margin: 24px 0;
            }}
            .code-label {{
                font-size: 14px;
                color: #6b7280;
                margin: 0 0 12px 0;
                font-weight: 500;
            }}
            .code {{
                font-size: 42px;
                font-weight: 700;
                letter-spacing: 12px;
                color: #000;
                font-family: 'Courier New', monospace;
                margin: 0;
            }}
            .divider {{
                text-align: center;
                margin: 32px 0;
                position: relative;
            }}
            .divider::before {{
                content: '';
                position: absolute;
                left: 0;
                right: 0;
                top: 50%;
                height: 1px;
                background: #e5e7eb;
            }}
            .divider-text {{
                background: #fff;
                padding: 0 16px;
                color: #9ca3af;
                font-size: 14px;
                position: relative;
                display: inline-block;
            }}
            .button {{
                display: inline-block;
                padding: 16px 32px;
                background: #000;
                color: #fff !important;
                text-decoration: none;
                border-radius: 10px;
                font-weight: 600;
                font-size: 16px;
                margin: 0;
            }}
            .button-container {{
                text-align: center;
                margin: 24px 0;
            }}
            .footer {{
                background: #f9fafb;
                padding: 24px;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                border-top: 1px solid #e5e7eb;
            }}
            .warning {{
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 16px;
                margin: 24px 0;
                border-radius: 8px;
            }}
            .warning-text {{
                font-size: 14px;
                color: #92400e;
                margin: 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="logo">Alliv</h1>
            </div>
            <div class="content">
                <p class="greeting">Hi {user_name}! 👋</p>
                <p class="text">
                    Here's your Alliv verification code. Enter it within 10 minutes to verify your email address.
                </p>
                
                <div class="code-section">
                    <p class="code-label">Your verification code:</p>
                    <p class="code">{formatted_code}</p>
                </div>
                
                <div class="divider">
                    <span class="divider-text">OR</span>
                </div>
                
                <div class="button-container">
                    <a href="{action_link}" class="button">Verify with One Tap</a>
                </div>
                
                <div class="warning">
                    <p class="warning-text">
                        <strong>[TIME] This code expires in 10 minutes.</strong><br>
                        If you didn't request this, please ignore this email.
                    </p>
                </div>
            </div>
            <div class="footer">
                <p style="margin: 0 0 8px 0;">© 2025 Alliv. All rights reserved.</p>
                <p style="margin: 0; font-size: 12px;">Alliv Security</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
Hi {user_name}!

Here's your Alliv verification code:
{formatted_code}

Or verify with one tap:
{action_link}

This code/link expires in 10 minutes. If this wasn't you, ignore this email.

— Alliv Security
© 2025 Alliv. All rights reserved.
    """
    
    try:
        return await send_email(to_email, subject, html_content, text_content)
    except Exception as exc:
        logger.error("Failed to dispatch verification email: %s", exc)
        return False


async def send_reset_password_email(
    to_email: str,
    user_name: str,
    verification_code: Optional[str],
    verification_link: Optional[str] = None,
) -> bool:
    """
    Send password reset helper email with both code and fallback link.
    """
    normalized_code = _normalize_code(verification_code)
    if not normalized_code:
        logger.warning("send_reset_password_email called without verification_code - skipping send")
        return False
    
    subject = "Password Reset Code"
    formatted_code = _format_code_for_display(normalized_code)
    action_link = _build_action_link(verification_link, "/reset-password", normalized_code)
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f9fafb; padding: 24px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 10px 15px rgba(0,0,0,0.05);">
            <h2 style="margin-top: 0; color: #111827;">Reset password request</h2>
            <p style="color: #4b5563;">
                Hi {user_name}, we received a request to reset your Alliv password. Use the code below or click the button to continue.
            </p>
            <div style="border: 1px dashed #d1d5db; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0;">
                <p style="margin: 0 0 12px 0; color: #6b7280;">Reset password code</p>
                <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 0; color: #111827;">{formatted_code}</p>
            </div>
            <p style="text-align: center;">
                <a href="{action_link}" style="display: inline-block; padding: 14px 28px; background: #000; color: #fff; border-radius: 10px; text-decoration: none; font-weight: 600;">
                    Reset password
                </a>
            </p>
            <p style="color: #9ca3af; font-size: 14px; margin-top: 24px;">
                If you didn't request this, you can safely ignore the email. The code expires in 10 minutes.
            </p>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
Hi {user_name},

Reset password code: {formatted_code}
Reset password link: {action_link}

If you didn't request this, you can ignore the email. The code expires in 10 minutes.
    """
    
    try:
        return await send_email(to_email, subject, html_content, text_content)
    except Exception as exc:
        logger.error("Failed to dispatch reset password email: %s", exc)
        return False
