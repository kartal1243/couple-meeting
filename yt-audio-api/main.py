import secrets
import threading
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from uuid import uuid4
from pathlib import Path
import yt_dlp
import access_manager
from constants import *

app = Flask(__name__)
CORS(app)

os.makedirs(ABS_DOWNLOADS_PATH, exist_ok=True)

@app.route("/", methods=["GET"])
def handle_audio_request():
    video_url = request.args.get("url")
    if not video_url:
        return jsonify(error="Missing 'url' parameter"), BAD_REQUEST

    filename = f"{uuid4()}.mp3"
    output_path = Path(ABS_DOWNLOADS_PATH) / filename

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': str(output_path),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192'
        }],
        'quiet': True
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([video_url])
    except Exception as e:
        return jsonify(error="Download failed", detail=str(e)), INTERNAL_SERVER_ERROR

    token = secrets.token_urlsafe(TOKEN_LENGTH)
    access_manager.add_token(token, filename)
    return jsonify(token=token)

@app.route("/download", methods=["GET"])
def download_audio():
    token = request.args.get("token")
    if not token:
        return jsonify(error="Missing 'token'"), BAD_REQUEST
    if not access_manager.has_access(token):
        return jsonify(error="Invalid token"), UNAUTHORIZED
    if not access_manager.is_valid(token):
        return jsonify(error="Token expired"), REQUEST_TIMEOUT
    try:
        filename = access_manager.get_audio_file(token)
        return send_from_directory(ABS_DOWNLOADS_PATH, filename=filename, as_attachment=True)
    except FileNotFoundError:
        return jsonify(error="File not found"), NOT_FOUND

@app.route("/health", methods=["GET"])
def health():
    return jsonify(status="ok")

if __name__ == "__main__":
    threading.Thread(target=access_manager.manage_tokens, daemon=True).start()
    app.run(host="0.0.0.0", port=5000)
