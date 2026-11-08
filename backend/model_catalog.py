"""Models backed by providers with public, documented APIs.

Entries are exposed only when the matching server-side API key is configured.
Keys never belong in the mobile/web bundle.
"""

import os

MODEL_CATALOG = [
    {"id": "openai-gpt-4o-mini", "provider": "OpenAI", "name": "GPT-4o mini", "model": "gpt-4o-mini", "api_env": "OPENAI_API_KEY", "api_type": "openai", "source": "openai/openai-python"},
    {"id": "anthropic-claude", "provider": "Anthropic", "name": "Claude 3.5 Sonnet", "model": "claude-3-5-sonnet-20241022", "api_env": "ANTHROPIC_API_KEY", "api_type": "anthropic", "source": "anthropics/anthropic-sdk-python"},
    {"id": "google-gemini", "provider": "Google", "name": "Gemini 2.0 Flash", "model": "gemini-2.0-flash", "api_env": "GOOGLE_API_KEY", "api_type": "gemini", "source": "google-gemini/generative-ai-python"},
    {"id": "mistral-small", "provider": "Mistral", "name": "Mistral Small", "model": "mistral-small-latest", "api_env": "MISTRAL_API_KEY", "api_type": "openai", "base_url": "https://api.mistral.ai/v1", "source": "mistralai/mistral-inference"},
    {"id": "deepseek-chat", "provider": "DeepSeek", "name": "DeepSeek Chat", "model": "deepseek-chat", "api_env": "DEEPSEEK_API_KEY", "api_type": "openai", "base_url": "https://api.deepseek.com/v1", "source": "deepseek-ai/DeepSeek-V3"},
    {"id": "groq-llama", "provider": "Groq", "name": "Llama 3.3 70B", "model": "llama-3.3-70b-versatile", "api_env": "GROQ_API_KEY", "api_type": "openai", "base_url": "https://api.groq.com/openai/v1", "source": "groq/groq-python"},
    {"id": "together-llama", "provider": "Together AI", "name": "Llama 3.3 70B Turbo", "model": "meta-llama/Llama-3.3-70B-Instruct-Turbo", "api_env": "TOGETHER_API_KEY", "api_type": "openai", "base_url": "https://api.together.xyz/v1", "source": "togethercomputer/together-python"},
    {"id": "fireworks-llama", "provider": "Fireworks AI", "name": "Llama 3.1 70B", "model": "accounts/fireworks/models/llama-v3p1-70b-instruct", "api_env": "FIREWORKS_API_KEY", "api_type": "openai", "base_url": "https://api.fireworks.ai/inference/v1", "source": "fireworks-ai/fireworks-python"},
]


def get_model(model_id: str) -> dict:
    for model in MODEL_CATALOG:
        if model["id"] == model_id:
            return model
    raise KeyError(model_id)


def configured_models() -> list[dict]:
    return [model for model in MODEL_CATALOG if os.getenv(model["api_env"])]
