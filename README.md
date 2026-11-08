# Flix Grim

Android/web Expo client with a FastAPI backend, API-backed AI chat, web search,
Firebase authentication, and a local Stable Diffusion-compatible image
generator.

## Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
export JWT_SECRET="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
# Start an Automatic1111-compatible server separately on port 7860.
.venv/bin/uvicorn main:app --reload --host 0.0.0.0
```

The Android emulator reaches the host backend at `http://10.0.2.2:8000`.
For a physical device, change `API_URL` in `mobile/App.tsx` to the host
computer's LAN IP.

## Mobile

```bash
cd mobile
npm install
npx expo start
```

The app supports Firebase email authentication (with local email fallback),
JWT-protected chat, image
generation, web search, voice synthesis/transcription, session revocation,
and billing status through:

- `POST /chat`
- `POST /images/generate`
- `POST /search`
- `POST /voice/speak`
- `POST /voice/transcribe`
- `GET /auth/me`, `GET /auth/sessions`, `POST /auth/logout`
- `GET /billing/status`, `POST /billing/checkout`

The image endpoint expects an
Automatic1111-compatible local API at `IMAGE_API_URL` (default
`http://127.0.0.1:7860`), with `--api` enabled.

Search uses DuckDuckGo Instant Answer by default. Override `SEARCH_API_URL`
for another search provider. Set `TTS_API_URL` to an OpenAI-compatible speech
endpoint and `STT_API_URL` to a multipart transcription endpoint to enable
voice. Set `CHECKOUT_URL` to your own trusted checkout page; payment secrets
must remain on the server and never in the APK.

AI chat uses only catalog entries whose server-side API key is configured:
`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `MISTRAL_API_KEY`,
`DEEPSEEK_API_KEY`, `GROQ_API_KEY`, `TOGETHER_API_KEY`, or
`FIREWORKS_API_KEY`. The catalog links official GitHub SDK/model repositories;
repositories without a documented API are intentionally not exposed as chat
models. API keys must stay on the backend.

`GET /models` exposes the Flix Grim model catalog. A catalog entry becomes
selectable only when its mapped Ollama model is installed locally. For example:

```bash
ollama pull llama3.2
ollama pull deepseek-r1
ollama pull qwen2.5-coder
ollama pull gemma2
```

The GitHub repositories listed in the catalog are source/model references, not
automatic downloads. Large models may require substantial RAM/VRAM and their
licenses must be reviewed before distribution.

For Firebase, set these Expo build-time variables in `mobile/.env` or the
hosting environment: `EXPO_PUBLIC_FIREBASE_API_KEY`,
`EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`,
`EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`, `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`,
and `EXPO_PUBLIC_FIREBASE_APP_ID`. Set the matching
`FIREBASE_SERVICE_ACCOUNT_JSON` on the backend. The Firebase web config is
client configuration; the service-account JSON is secret and must never be
bundled.
