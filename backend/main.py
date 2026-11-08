import base64
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import time
from typing import List

import httpx
import jwt
from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field

from model_catalog import configured_models, get_model

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
IMAGE_API_URL = os.getenv("IMAGE_API_URL", "http://127.0.0.1:7860")
SEARCH_API_URL = os.getenv("SEARCH_API_URL", "https://api.duckduckgo.com/")
TTS_API_URL = os.getenv("TTS_API_URL", "")
STT_API_URL = os.getenv("STT_API_URL", "")
CHECKOUT_URL = os.getenv("CHECKOUT_URL", "")
JWT_SECRET = os.getenv("JWT_SECRET")
DATABASE_PATH = os.getenv("DATABASE_PATH", "app.db")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET must be set")

app = FastAPI(title="Flix Grim API")
bearer = HTTPBearer()
firebase_admin_app = None
firebase_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
if firebase_json:
    try:
        import firebase_admin
        from firebase_admin import auth as firebase_auth, credentials

        service_account = json.loads(firebase_json)
        firebase_admin_app = firebase_admin.initialize_app(credentials.Certificate(service_account))
    except (ImportError, ValueError):
        firebase_admin_app = None


class Message(BaseModel):
    role: str = Field(pattern="^(system|user|assistant)$")
    content: str = Field(min_length=1, max_length=12000)


class ChatRequest(BaseModel):
    messages: List[Message] = Field(min_length=1, max_length=50)
    model: str = Field(default="meta-llama", min_length=1, max_length=64)


class ImageRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=2000)
    negative_prompt: str = Field(default="", max_length=2000)
    steps: int = Field(default=20, ge=1, le=50)
    width: int = Field(default=512, ge=256, le=1024)
    height: int = Field(default=512, ge=256, le=1024)


class SearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=500)
    limit: int = Field(default=8, ge=1, le=20)


class VoiceRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    voice: str = Field(default="default", min_length=1, max_length=80)


class TranscriptionRequest(BaseModel):
    audio_base64: str = Field(min_length=16, max_length=20_000_000)
    mime_type: str = Field(default="audio/m4a", max_length=80)


class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class FirebaseToken(BaseModel):
    id_token: str = Field(min_length=20, max_length=20_000)


def db() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.execute(
        "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL)"
    )
    connection.execute(
        "CREATE TABLE IF NOT EXISTS sessions (jti TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created_at INTEGER NOT NULL, revoked_at INTEGER)"
    )
    return connection


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return base64.urlsafe_b64encode(salt + digest).decode()


def verify_password(password: str, encoded: str) -> bool:
    raw = base64.urlsafe_b64decode(encoded.encode())
    return hmac.compare_digest(hash_password(password, raw[:16]), encoded)


def issue_token(user_id: int, email: str) -> str:
    jti = secrets.token_urlsafe(24)
    connection = db()
    connection.execute(
        "INSERT INTO sessions (jti, user_id, created_at) VALUES (?, ?, ?)",
        (jti, user_id, int(time.time())),
    )
    connection.commit()
    connection.close()
    return jwt.encode(
        {"sub": str(user_id), "email": email, "jti": jti, "exp": int(time.time()) + 86400},
        JWT_SECRET,
        algorithm="HS256",
    )


def current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        connection = db()
        active = connection.execute(
            "SELECT 1 FROM sessions WHERE jti = ? AND revoked_at IS NULL",
            (payload.get("jti"),),
        ).fetchone()
        connection.close()
        if not active:
            raise HTTPException(status_code=401, detail="Session has been logged out")
        return payload
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc


@app.post("/auth/register")
def register(credentials: Credentials) -> dict:
    connection = db()
    try:
        user_id = connection.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (credentials.email.lower(), hash_password(credentials.password)),
        ).lastrowid
        connection.commit()
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Email already registered") from exc
    finally:
        connection.close()
    return {"token": issue_token(user_id, credentials.email.lower())}


@app.post("/auth/login")
def login(credentials: Credentials) -> dict:
    connection = db()
    row = connection.execute(
        "SELECT id, email, password_hash FROM users WHERE email = ?",
        (credentials.email.lower(),),
    ).fetchone()
    connection.close()
    if not row or not verify_password(credentials.password, row[2]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"token": issue_token(row[0], row[1])}


@app.post("/auth/firebase")
def firebase_login(request: FirebaseToken) -> dict:
    if firebase_admin_app is None:
        raise HTTPException(status_code=503, detail="Firebase Admin is not configured")
    try:
        decoded = firebase_auth.verify_id_token(request.id_token, app=firebase_admin_app)
        user_id = int(hashlib.sha256(decoded["uid"].encode()).hexdigest()[:12], 16)
        email = decoded.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Firebase account has no email")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid Firebase token") from exc
    return {"token": issue_token(user_id, email.lower())}


@app.get("/auth/me")
async def me(user: dict = Depends(current_user)) -> dict:
    return {"id": user["sub"], "email": user["email"]}


@app.post("/auth/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc
    connection = db()
    connection.execute("UPDATE sessions SET revoked_at = ? WHERE jti = ?", (int(time.time()), payload.get("jti")))
    connection.commit()
    connection.close()
    return {"ok": True}


@app.get("/auth/sessions")
async def sessions(user: dict = Depends(current_user)) -> dict:
    connection = db()
    rows = connection.execute(
        "SELECT jti, created_at FROM sessions WHERE user_id = ? AND revoked_at IS NULL ORDER BY created_at DESC",
        (int(user["sub"]),),
    ).fetchall()
    connection.close()
    return {"sessions": [{"id": row[0][-8:], "created_at": row[1]} for row in rows]}


@app.get("/health")
async def health() -> dict:
    return {"ok": True, "models": len(configured_models()), "firebase": firebase_admin_app is not None}


@app.get("/models")
async def models(_: dict = Depends(current_user)) -> dict:
    return {"models": [{key: value for key, value in model.items() if key not in {"api_env", "api_type", "base_url"}} for model in configured_models()]}


@app.post("/chat")
async def chat(request: ChatRequest, _: dict = Depends(current_user)) -> dict:
    try:
        selected = get_model(request.model)
    except KeyError as exc:
        raise HTTPException(status_code=400, detail="Unknown model") from exc
    api_key = os.getenv(selected["api_env"])
    if not api_key:
        raise HTTPException(status_code=400, detail="Model API is not configured")
    messages = [message.model_dump() for message in request.messages]
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            if selected["api_type"] == "openai":
                base_url = selected.get("base_url", "https://api.openai.com/v1")
                response = await client.post(
                    f"{base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={"model": selected["model"], "messages": messages, "stream": False},
                )
                response.raise_for_status()
                content = response.json().get("choices", [{}])[0].get("message", {}).get("content")
            elif selected["api_type"] == "anthropic":
                system = next((item["content"] for item in messages if item["role"] == "system"), None)
                user_messages = [item for item in messages if item["role"] != "system"]
                payload = {"model": selected["model"], "max_tokens": 4096, "messages": user_messages}
                if system:
                    payload["system"] = system
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={"x-api-key": api_key, "anthropic-version": "2023-06-01"},
                    json=payload,
                )
                response.raise_for_status()
                content = response.json().get("content", [{}])[0].get("text")
            else:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{selected['model']}:generateContent",
                    params={"key": api_key},
                    json={"contents": [{"role": "user", "parts": [{"text": item["content"]}]} for item in messages if item["role"] != "system"]},
                )
                response.raise_for_status()
                content = response.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text")
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="Model API unavailable") from exc
    if not isinstance(content, str) or not content.strip():
        raise HTTPException(status_code=502, detail="Model returned an invalid response")
    return {"message": {"role": "assistant", "content": content}}


@app.post("/images/generate")
async def generate_image(request: ImageRequest, _: dict = Depends(current_user)) -> dict:
    try:
        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(
                f"{IMAGE_API_URL}/sdapi/v1/txt2img",
                json=request.model_dump(),
            )
            response.raise_for_status()
            data = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="Local image model unavailable") from exc
    images = data.get("images")
    if not isinstance(images, list) or not images or not isinstance(images[0], str):
        raise HTTPException(status_code=502, detail="Image model returned an invalid response")
    return {"image": f"data:image/png;base64,{images[0]}"}


@app.post("/search")
async def search(request: SearchRequest, _: dict = Depends(current_user)) -> dict:
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                SEARCH_API_URL,
                params={"q": request.query, "format": "json", "no_html": 1, "skip_disambig": 1},
                headers={"User-Agent": "FlixGrim/1.0"},
            )
            response.raise_for_status()
            data = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="Search service unavailable") from exc
    results = []
    if data.get("AbstractText"):
        results.append({"title": data.get("Heading") or request.query, "url": data.get("AbstractURL", ""), "snippet": data["AbstractText"]})
    for topic in data.get("RelatedTopics", []):
        if isinstance(topic, dict) and topic.get("Text"):
            results.append({"title": topic["Text"].split(" - ")[0], "url": topic.get("FirstURL", ""), "snippet": topic["Text"]})
        if len(results) >= request.limit:
            break
    return {"query": request.query, "results": results[:request.limit]}


@app.post("/voice/speak")
async def speak(request: VoiceRequest, _: dict = Depends(current_user)) -> dict:
    if not TTS_API_URL:
        raise HTTPException(status_code=503, detail="TTS_API_URL is not configured")
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(TTS_API_URL, json={"input": request.text, "voice": request.voice, "response_format": "mp3"})
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Voice service unavailable") from exc
    return {"audio_base64": base64.b64encode(response.content).decode(), "mime_type": "audio/mpeg"}


@app.post("/voice/transcribe")
async def transcribe(request: TranscriptionRequest, _: dict = Depends(current_user)) -> dict:
    if not STT_API_URL:
        raise HTTPException(status_code=503, detail="STT_API_URL is not configured")
    try:
        audio = base64.b64decode(request.audio_base64)
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(STT_API_URL, files={"file": ("recording", audio, request.mime_type)})
            response.raise_for_status()
            data = response.json()
    except (ValueError, httpx.HTTPError) as exc:
        raise HTTPException(status_code=502, detail="Transcription service unavailable") from exc
    if not isinstance(data.get("text"), str):
        raise HTTPException(status_code=502, detail="Transcription service returned an invalid response")
    return {"text": data["text"]}


@app.get("/billing/status")
async def billing_status(_: dict = Depends(current_user)) -> dict:
    return {"plan": "free", "active": False, "checkout_available": bool(CHECKOUT_URL)}


@app.post("/billing/checkout")
async def billing_checkout(_: dict = Depends(current_user)) -> dict:
    if not CHECKOUT_URL:
        raise HTTPException(status_code=503, detail="CHECKOUT_URL is not configured")
    return {"url": CHECKOUT_URL}
