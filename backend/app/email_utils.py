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
        logger.warning("SMTP_URL not configured - email not sent")
        return False
    
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
        
        logger.info(f"✅ Email sent to {to_email}: {subject}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_email}: {e}")
        return False


async def send_verification_email(to_email: str, verification_link: str, user_name: str, verification_code: str) -> bool:
    """
    Send email verification email with OTP and magic link
    Production-grade template with security best practices
    """
    subject = "Alliv — Verify your email"
    
    # Format code for display: 123456 → "123 456"
    formatted_code = f"{verification_code[:3]} {verification_code[3:]}"
    
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
                    <a href="{verification_link}" class="button">Verify with One Tap</a>
                </div>
                
                <div class="warning">
                    <p class="warning-text">
                        <strong>⏰ This code expires in 10 minutes.</strong><br>
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
{verification_link}

This code/link expires in 10 minutes. If this wasn't you, ignore this email.

— Alliv Security
© 2025 Alliv. All rights reserved.
    """
    
    return await send_email(to_email, subject, html_content, text_content)
