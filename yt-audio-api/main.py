import os
import sys
import secrets
import threading
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DOWNLOADS_DIR = Path(__file__).resolve().parent / 'downloads'
DOWNLOADS_DIR.mkdir(exist_ok=True)

# Lazy import yt_dlp
_yt_dlp = None
def get_yt_dlp():
    global _yt_dlp
    if _yt_dlp is None:
        import yt_dlp as _ydl
        _yt_dlp = _ydl
    return _yt_dlp

# Simple in-memory token store
tokens = {}
lock = threading.Lock()

def cleanup_loop():
    import time
    while True:
        time.sleep(30)
        now = __import__('time').time()
        with lock:
            expired = [t for t, v in list(tokens.items()) if now - v['created'] > 300]
            for t in expired:
                try:
                    (Path(__file__).resolve().parent / 'downloads' / tokens[t]['file']).unlink(missing_ok=True)
                except: pass
                del tokens[t]

@app.route("/", methods=["GET"])
def handle_audio_request():
    video_url = request.args.get("url")
    if not video_url:
        return jsonify(error="Missing url parameter"), 400

    filename = f"{secrets.token_hex(16)}.mp3"
    output_path = str(DOWNLOADS_DIR / filename)

    try:
        ydl_mod = get_yt_dlp()
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_path,
            'postprocessors': [{'key': 'FFmpegExtractAudio', 'preferredcodec': 'mp3', 'preferredquality': '192'}],
            'quiet': True, 'no_warnings': True
        }
        with ydl_mod.YoutubeDL(ydl_opts) as ydl:
            ydl.download([video_url])
    except Exception as e:
        return jsonify(error=str(e)), 500

    token = secrets.token_urlsafe(20)
    with lock:
        tokens[token] = {'file': filename, 'created': __import__('time').time()}

    download_url = f"{request.host_url}download?token={token}"
    return jsonify(token=token, downloadUrl=download_url)

@app.route("/download", methods=["GET"])
def download_audio():
    token = request.args.get("token")
    if not token:
        return jsonify(error="Missing token"), 400
    with lock:
        if token not in tokens:
            return jsonify(error="Invalid token"), 401
        filename = tokens[token]['file']
    try:
        return send_from_directory(str(DOWNLOADS_DIR), filename=filename, as_attachment=True)
    except FileNotFoundError:
        return jsonify(error="File not found"), 404

@app.route("/health", methods=["GET"])
def health():
    return jsonify(status="ok", service="yt-audio-api")

threading.Thread(target=cleanup_loop, daemon=True).start()
