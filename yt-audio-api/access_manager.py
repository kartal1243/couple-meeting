import time
import os
from datetime import datetime, timedelta
from pathlib import Path
from constants import EXPIRY_TIME_MINUTES, DOWNLOADS_DIRECTORY

allowed_tokens = {}
audio_files = {}

def add_token(token, filename):
    expiry = datetime.now() + timedelta(minutes=EXPIRY_TIME_MINUTES)
    allowed_tokens[token] = expiry
    audio_files[token] = filename

def has_access(token):
    return token in allowed_tokens

def is_valid(token):
    return allowed_tokens[token] >= datetime.now()

def get_audio_file(token):
    return audio_files[token]

def remove_expired_tokens():
    expired = []
    files_to_remove = []
    for token in list(allowed_tokens.keys()):
        if not is_valid(token):
            expired.append(token)
            files_to_remove.append(audio_files.pop(token, None))
    for token in expired:
        allowed_tokens.pop(token, None)
    return [f for f in files_to_remove if f]

def delete_expired_files(files):
    for file in files:
        try:
            full_path = Path(DOWNLOADS_DIRECTORY) / file
            full_path.unlink(missing_ok=True)
        except Exception:
            pass

def manage_tokens():
    while True:
        expired_files = remove_expired_tokens()
        delete_expired_files(expired_files)
        time.sleep(1)
