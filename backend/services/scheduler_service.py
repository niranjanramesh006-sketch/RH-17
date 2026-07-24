from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.memory import MemoryJobStore
from services.email_service import send_email
from datetime import datetime
import uuid
import re

# Initialize scheduler
jobstores = {"default": MemoryJobStore()}
scheduler = BackgroundScheduler(jobstores=jobstores)
scheduler.start()

def schedule_reminder(
    user_email: str,
    user_name: str,
    reminder_text: str,
    remind_at: datetime
) -> str:
    """Schedule a reminder email"""
    job_id = str(uuid.uuid4())

    scheduler.add_job(
        func=send_email,
        trigger="date",
        run_date=remind_at,
        args=[
            user_email,
            f"⏰ UniAssist Reminder",
            f"Hi {user_name},\n\nThis is your scheduled reminder:\n\n{reminder_text}\n\nScheduled at: {remind_at.strftime('%Y-%m-%d %H:%M')}\n\nUniAssist AI"
        ],
        id=job_id
    )

    print(f"⏰ Reminder scheduled for {remind_at} → {user_email}")
    return job_id

def parse_reminder_datetime(message: str) -> datetime | None:
    from datetime import timedelta
    now = datetime.now()
    msg = message.lower()

    # Handle DD/MM/YYYY format
    date_match = re.search(r'(\d{1,2})/(\d{1,2})/(\d{4})', message)
    if date_match:
        day = int(date_match.group(1))
        month = int(date_match.group(2))
        year = int(date_match.group(3))
        try:
            base_date = datetime(year, month, day)
            # Extract time if mentioned
            time_match = re.search(r'(\d{1,2}):?(\d{2})?\s*(am|pm)?', msg)
            if time_match:
                hour = int(time_match.group(1))
                minute = int(time_match.group(2)) if time_match.group(2) else 0
                period = time_match.group(3)
                if period == "pm" and hour != 12:
                    hour += 12
                elif period == "am" and hour == 12:
                    hour = 0
                return base_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            return base_date.replace(hour=9, minute=0, second=0, microsecond=0)
        except:
            pass

    # In X minutes
    if "in " in msg and "minute" in msg:
        match = re.search(r'in (\d+) minute', msg)
        if match:
            minutes = int(match.group(1))
            return now + timedelta(minutes=minutes)
        return None

    # In X hours
    if "in " in msg and "hour" in msg:
        match = re.search(r'in (\d+) hour', msg)
        if match:
            hours = int(match.group(1))
            return now + timedelta(hours=hours)
        return None

    # In X days
    if "in " in msg and "day" in msg:
        match = re.search(r'in (\d+) day', msg)
        if match:
            days = int(match.group(1))
            base_date = now + timedelta(days=days)
            time_match = re.search(r'(\d{1,2}):?(\d{2})?\s*(am|pm)?', msg)
            if time_match:
                hour = int(time_match.group(1))
                minute = int(time_match.group(2)) if time_match.group(2) else 0
                period = time_match.group(3)
                if period == "pm" and hour != 12:
                    hour += 12
                elif period == "am" and hour == 12:
                    hour = 0
                return base_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            return base_date.replace(hour=9, minute=0, second=0, microsecond=0)

    # Tomorrow
    if "tomorrow" in msg:
        base_date = now + timedelta(days=1)
    # Today
    elif "today" in msg:
        base_date = now
    # Month name
    elif any(month in msg for month in [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december"
    ]):
        months = {
            "january": 1, "february": 2, "march": 3, "april": 4,
            "may": 5, "june": 6, "july": 7, "august": 8,
            "september": 9, "october": 10, "november": 11, "december": 12
        }
        for month_name, month_num in months.items():
            if month_name in msg:
                day_match = re.search(r'(\d+)', msg)
                if day_match:
                    day = int(day_match.group(1))
                    year = now.year
                    try:
                        base_date = datetime(year, month_num, day)
                        if base_date < now:
                            base_date = datetime(year + 1, month_num, day)
                    except:
                        return None
                    break
        else:
            return None
    else:
        return None

    # Extract time
    time_match = re.search(r'(\d{1,2}):?(\d{2})?\s*(am|pm)?', msg)
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2)) if time_match.group(2) else 0
        period = time_match.group(3)
        if period == "pm" and hour != 12:
            hour += 12
        elif period == "am" and hour == 12:
            hour = 0
        return base_date.replace(hour=hour, minute=minute, second=0, microsecond=0)

    return base_date.replace(hour=9, minute=0, second=0, microsecond=0)

def detect_reminder_intent(message: str) -> bool:
    """Detect if user wants to set a reminder"""
    msg = message.lower()
    keywords = [
        "remind me", "set a reminder", "schedule", "reminder",
        "remind", "set reminder", "appointment", "alert me",
        "notify me", "don't forget", "schedule a meeting"
    ]
    return any(k in msg for k in keywords)

def get_scheduled_jobs() -> list:
    """Get all pending reminders"""
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "next_run": str(job.next_run_time),
            "args": job.args
        })
    return jobs