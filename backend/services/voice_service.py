from groq import Groq
from dotenv import load_dotenv
import os
import tempfile
import subprocess

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def convert_to_mp3(input_path: str) -> str:
    """Convert audio to mp3 using ffmpeg"""
    output_path = input_path.replace(".webm", ".mp3").replace(".ogg", ".mp3")
    try:
        subprocess.run([
            "ffmpeg", "-i", input_path,
            "-ar", "16000",  # 16kHz sample rate
            "-ac", "1",      # mono
            "-b:a", "64k",   # bitrate
            output_path, "-y", "-loglevel", "quiet"
        ], check=True)
        return output_path
    except Exception as e:
        print(f"FFmpeg conversion error: {e}")
        return input_path  # return original if conversion fails

def transcribe_audio(audio_file_path: str, domain: str = "general") -> str:
    domain_prompts = {
        "healthcare": "Medical conversation about symptoms, medications, appointments, doctors, hospital.",
        "education": "Educational conversation about courses, assignments, exams, students, teachers.",
        "hr": "HR conversation about leave, salary, recruitment, employees, policies.",
        "support": "Customer support conversation about products, issues, complaints, orders.",
        "sales": "Sales conversation about products, pricing, discounts, purchase.",
        "general": "General conversation."
    }
    prompt = "Tamil English mixed conversation. " + domain_prompts.get(domain, domain_prompts["general"])

    try:
        with open(audio_file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=(os.path.basename(audio_file_path), audio_file.read()),
                model="whisper-large-v3",
                response_format="text",
                language="en",
                prompt="Tamil English mixed conversation. " + prompt 
            )
        return transcription.strip()
    except Exception as e:
        print(f"❌ Transcription error: {str(e)}")
        return ""

def detect_escalation_intent(message: str) -> bool:
    msg = message.lower()
    keywords = ["yes", "connect", "human", "agent", "person", "staff",
                "representative", "ok", "okay", "sure", "please connect"]
    return any(k in msg for k in keywords)