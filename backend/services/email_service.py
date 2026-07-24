import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

load_dotenv()

MAIL_EMAIL = os.getenv("MAIL_EMAIL")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

def send_email(to_email: str, subject: str, body: str) -> bool:
    try:
        msg = MIMEMultipart()
        msg["From"] = MAIL_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        # Use SSL on port 465 instead of TLS on 587
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(MAIL_EMAIL, MAIL_PASSWORD)
        server.sendmail(MAIL_EMAIL, to_email, msg.as_string())
        server.quit()

        print(f"✅ Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Email error: {str(e)}")
        return False

def detect_email_intent(message: str) -> dict:
    msg = message.lower()
    keywords = [
        "send email", "send this to", "email me", "send to my email",
        "mail this", "send mail", "email this", "send it to",
        "send this answer", "send answer", "send to email",
        "send this", "mail me", "to my email", "send the answer"
    ]
    if any(k in msg for k in keywords):
        return {"send_email": True}
    return {"send_email": False}