import pytest

from app import email_utils


@pytest.mark.asyncio
async def test_send_verification_email_invokes_send_email(monkeypatch):
    """send_verification_email should call send_email with rendered template."""
    captured = {}

    async def fake_send_email(to_email, subject, html, text):
        captured["args"] = (to_email, subject, html, text)
        return True

    monkeypatch.setattr(email_utils, "send_email", fake_send_email)

    result = await email_utils.send_verification_email(
        to_email="test@example.com",
        user_name="Tester",
        verification_code="123456",
    )

    assert result is True
    assert captured["args"][0] == "test@example.com"
    assert "123 456" in captured["args"][2]


@pytest.mark.asyncio
async def test_send_verification_email_requires_code(monkeypatch):
    """Without verification code the helper should bail early."""
    called = False

    async def fake_send_email(*args, **kwargs):
        nonlocal called
        called = True
        return True

    monkeypatch.setattr(email_utils, "send_email", fake_send_email)

    result = await email_utils.send_verification_email(
        to_email="test@example.com",
        user_name="Tester",
        verification_code=None,
    )

    assert result is False
    assert called is False


@pytest.mark.asyncio
async def test_send_reset_password_email_uses_reset_template(monkeypatch):
    """Wrapper should set reset template and default subject."""
    captured = {}

    async def fake_send_email(to_email, subject, html, text):
        captured["args"] = (to_email, subject, html, text)
        return True

    monkeypatch.setattr(email_utils, "send_email", fake_send_email)

    result = await email_utils.send_reset_password_email(
        to_email="reset@example.com",
        user_name="Reset User",
        verification_code="987654",
        verification_link="https://example.com/reset",
    )

    assert result is True
    assert captured["args"][1] == "Password Reset Code"
    assert "Reset password" in captured["args"][2]






