import json
import os
from typing import Any

from pydantic import ValidationError

from .extraction import ExtractionDraft, validate_extraction


DEFAULT_GEMINI_MODEL = "gemini-2.0-flash"
EXTRACTION_PROMPT = """Extract the prescription into the requested JSON schema. Use null for an unreadable date and empty strings for unreadable medicine fields. Do not invent values."""


class GeminiConfigurationError(RuntimeError):
    """Raised when Gemini cannot be configured in the current environment."""


class GeminiExtractionProvider:
    """Gemini adapter that returns the shared, editable extraction draft."""

    def __init__(self, api_key: str | None = None, model: str | None = None, client: Any = None) -> None:
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model = model or os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)
        self._client = client

    def _client_and_types(self) -> tuple[Any, Any]:
        if self._client is not None:
            return self._client, None
        if not self.api_key:
            raise GeminiConfigurationError("GEMINI_API_KEY is not configured")
        try:
            from google import genai
            from google.genai import types
        except ImportError as error:
            raise GeminiConfigurationError(
                "google-genai is not installed; install it before using Gemini extraction"
            ) from error
        return genai.Client(api_key=self.api_key), types

    def extract(self, document: bytes, mime_type: str) -> ExtractionDraft:
        """Send document bytes to Gemini and validate its structured draft."""
        client, sdk_types = self._client_and_types()
        if sdk_types is None:
            document_part = {"data": document, "mime_type": mime_type}
            config = {"response_mime_type": "application/json", "response_schema": ExtractionDraft}
        else:
            document_part = sdk_types.Part.from_bytes(data=document, mime_type=mime_type)
            config = sdk_types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ExtractionDraft,
            )

        response = client.models.generate_content(
            model=self.model,
            contents=[document_part, EXTRACTION_PROMPT],
            config=config,
        )
        response_text = getattr(response, "text", None)
        if not response_text:
            raise ValueError("Gemini returned an empty extraction response")
        try:
            draft = ExtractionDraft.model_validate(json.loads(response_text))
        except (json.JSONDecodeError, ValidationError) as error:
            raise ValueError("Gemini returned invalid extraction JSON") from error
        return validate_extraction(draft)
