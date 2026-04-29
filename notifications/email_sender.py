"""
Email notifications via SMTP.

Конфигурация через переменные окружения:
  SMTP_HOST     — хост (default: пустой → demo-режим)
  SMTP_PORT     — порт (default: 587)
  SMTP_USER     — логин
  SMTP_PASSWORD — пароль приложения (App Password для Gmail)
  SMTP_FROM     — адрес отправителя
  SMTP_USE_SSL  — true → порт 465, SMTP_SSL; false → порт 587, STARTTLS

Если SMTP_HOST не задан — письмо выводится в консоль (demo-режим).

Адреса получателей для демо-пользователей:
  DEMO_EMAIL_ALICE / BOB / CAROL / DAVE
"""

import asyncio
import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "notifications@meta-platform.local")
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").lower() == "true"

DEMO_USER_EMAILS: dict[str, str] = {
    "alice": os.getenv("DEMO_EMAIL_ALICE", "alice@example.com"),
    "bob":   os.getenv("DEMO_EMAIL_BOB",   "bob@example.com"),
    "carol": os.getenv("DEMO_EMAIL_CAROL", "carol@example.com"),
    "dave":  os.getenv("DEMO_EMAIL_DAVE",  "dave@example.com"),
}


def _build_html(message: str, entity_name: str, record_title: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 24px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px;
              padding: 24px; border: 1px solid #e5e7eb;">
    <h2 style="margin: 0 0 8px; color: #111827;">🔔 {entity_name}</h2>
    <p style="color: #6b7280; margin: 0 0 16px;">{record_title}</p>
    <p style="color: #374151;">{message}</p>
    <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 16px 0;">
    <p style="font-size: 12px; color: #9ca3af;">Meta Platform · Notification Service</p>
  </div>
</body>
</html>"""


def _send_smtp(to_email: str, subject: str, html: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    context = ssl.create_default_context()

    if SMTP_USE_SSL:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            if SMTP_USER:
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())
    else:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls(context=context)
            if SMTP_USER:
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())


def _log_email(to_email: str, subject: str, message: str) -> None:
    print(
        f"\n{'='*60}\n"
        f"📧  [EMAIL — demo mode, SMTP_HOST not set]\n"
        f"    To:      {to_email}\n"
        f"    Subject: {subject}\n"
        f"    Body:    {message}\n"
        f"{'='*60}\n"
    )


async def send_creation_emails(
    entity_name: str,
    record_title: str,
    message: str,
) -> None:
    subject = f"New {entity_name}: {record_title}"
    html = _build_html(message, entity_name, record_title)

    async def _send_to(user_id: str, to_email: str) -> None:
        if not SMTP_HOST:
            _log_email(to_email, subject, message)
            return
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, _send_smtp, to_email, subject, html)
            print(f"📧  Email sent to {to_email} ({user_id})")
        except Exception as exc:
            print(f"📧  Failed to send email to {to_email}: {exc}")

    await asyncio.gather(*[_send_to(uid, email) for uid, email in DEMO_USER_EMAILS.items()])
