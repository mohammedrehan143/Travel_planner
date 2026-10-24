"""
Groq Configuration & Multi-Agent Orchestrator
TripPilot AI / Multi-Agent Platform

Features:
- Configurable inference parameters (model, temperature, max_completion_tokens, reasoning_effort, streaming).
- Automatic .env loading (from root and backend/.env).
- Multi-model fallback queue (auto-failover on 429 rate limit or API error).
- Adaptive argument handling (safely omits reasoning_effort for models that do not support it).
- Real-time streaming generator and structured orchestration output.
- CLI execution mode for standalone testing.
"""

import os
import sys
import json
from dataclasses import dataclass, field
from typing import Generator, List, Dict, Any, Optional
from pathlib import Path

# Try loading dotenv if installed
try:
    from dotenv import load_dotenv
    # Check current dir, parent dir, and backend/.env
    for env_path in [Path('.env'), Path('backend/.env'), Path('../backend/.env')]:
        if env_path.exists():
            load_dotenv(dotenv_path=env_path)
            break
except ImportError:
    pass

try:
    from groq import Groq
except ImportError:
    Groq = None  # Handled gracefully with installation instructions


@dataclass
class GroqOrchestratorConfig:
    """Configuration class for Groq API Orchestration."""
    api_key: Optional[str] = None
    model: str = "openai/gpt-oss-120b"
    fallback_models: List[str] = field(default_factory=lambda: [
        "openai/gpt-oss-120b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "qwen/qwen3.8-27b",
        "mixtral-8x7b-32768"
    ])
    temperature: float = 1.0
    max_completion_tokens: int = 2048
    top_p: float = 1.0
    reasoning_effort: Optional[str] = "medium"
    stream: bool = True
    stop: Optional[List[str]] = None
    system_prompt: str = (
        "You are the TripPilot Master Orchestrator Agent. "
        "You evaluate user travel requests, coordinate specialized agents, "
        "synthesize structured schedules, and enforce verification and safety."
    )

    def __post_init__(self):
        if not self.api_key:
            self.api_key = os.getenv("GROQ_API_KEY")


class GroqOrchestrator:
    """
    Production-ready Groq Orchestrator Engine.
    Handles streaming, multi-turn dialogue, error recovery, and model fallbacks.
    """

    def __init__(self, config: Optional[GroqOrchestratorConfig] = None):
        self.config = config or GroqOrchestratorConfig()
        
        if Groq is None:
            raise ImportError(
                "The 'groq' package is not installed. Please install it with:\n"
                "  pip install groq python-dotenv"
            )

        if not self.config.api_key:
            raise ValueError(
                "GROQ_API_KEY is not set. Please set it in your environment or .env file:\n"
                "  export GROQ_API_KEY='gsk_...'"
            )

        self.client = Groq(api_key=self.config.api_key)
        self.conversation_history: List[Dict[str, str]] = []

    def reset_history(self, custom_system_prompt: Optional[str] = None):
        """Clears memory and initializes the system role."""
        sys_prompt = custom_system_prompt or self.config.system_prompt
        self.conversation_history = [{"role": "system", "content": sys_prompt}]

    def _prepare_call_kwargs(self, model: str, messages: List[Dict[str, str]], stream: bool) -> Dict[str, Any]:
        """Prepares API payload parameters."""
        kwargs: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": self.config.temperature,
            "max_completion_tokens": self.config.max_completion_tokens,
            "top_p": self.config.top_p,
            "stream": stream,
            "stop": self.config.stop,
        }
        # Include reasoning_effort only if specified
        if self.config.reasoning_effort:
            kwargs["reasoning_effort"] = self.config.reasoning_effort

        return kwargs

    def stream_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None
    ) -> Generator[str, None, None]:
        """
        Streams completion tokens in real-time, matching the user's streaming loop.
        Automatically handles model fallbacks if a model fails or is rate-limited.
        """
        messages = [
            {"role": "system", "content": system_prompt or self.config.system_prompt},
            {"role": "user", "content": prompt}
        ]

        # Prioritize primary model followed by fallbacks
        model_queue = [self.config.model] + [
            m for m in self.config.fallback_models if m != self.config.model
        ]

        last_error = None
        for current_model in model_queue:
            kwargs = self._prepare_call_kwargs(current_model, messages, stream=True)

            try:
                try:
                    completion = self.client.chat.completions.create(**kwargs)
                except Exception as ex:
                    # If reasoning_effort is unsupported by current model, retry without it
                    if "reasoning_effort" in str(ex) or "extra_forbidden" in str(ex):
                        kwargs.pop("reasoning_effort", None)
                        completion = self.client.chat.completions.create(**kwargs)
                    else:
                        raise ex

                # Stream response chunks to caller
                for chunk in completion:
                    delta = chunk.choices[0].delta.content if chunk.choices else ""
                    if delta:
                        yield delta
                return  # Successful completion

            except Exception as err:
                last_error = err
                print(f"\n[Warning] Model '{current_model}' encountered an issue: {err}. Trying fallback...", file=sys.stderr)
                continue

        raise RuntimeError(f"All Groq models failed. Last error: {last_error}")

    def execute_and_print(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Executes prompt and prints delta tokens directly to stdout as they arrive.
        Returns the accumulated full response string.
        """
        full_response = []
        for chunk in self.stream_completion(prompt, system_prompt):
            print(chunk, end="", flush=True)
            full_response.append(chunk)
        print()  # Final newline
        return "".join(full_response)

    def orchestrate_task(
        self,
        user_request: str,
        task_type: str = "travel_plan"
    ) -> Dict[str, Any]:
        """
        Full orchestration pipeline:
        1. Synthesizes task plan.
        2. Queries model for structured JSON output.
        3. Returns parsed result.
        """
        orchestrator_prompt = f"""
Task Type: {task_type}
User Request: "{user_request}"

Provide a structured plan with the following JSON schema:
{{
  "task_classification": "{task_type}",
  "status": "planned",
  "execution_steps": [
    {{"step": 1, "agent": "researcher", "action": "..."}},
    {{"step": 2, "agent": "budget_optimizer", "action": "..."}},
    {{"step": 3, "agent": "validator", "action": "..."}}
  ],
  "recommendations": "..."
}}
Return ONLY valid JSON.
"""
        messages = [
            {"role": "system", "content": "You are the TripPilot Agent Orchestrator. Output strictly valid JSON."},
            {"role": "user", "content": orchestrator_prompt}
        ]

        kwargs = self._prepare_call_kwargs(self.config.model, messages, stream=False)
        try:
            response = self.client.chat.completions.create(**kwargs)
        except Exception:
            kwargs.pop("reasoning_effort", None)
            response = self.client.chat.completions.create(**kwargs)

        raw_content = response.choices[0].message.content or ""
        clean_json = raw_content.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()

        try:
            return json.loads(clean_json)
        except json.JSONDecodeError:
            return {"raw_output": raw_content}


# -------------------------------------------------------------
# Standalone CLI / Demo Harness
# -------------------------------------------------------------
if __name__ == "__main__":
    prompt = sys.argv[1] if len(sys.argv) > 1 else (
        "Design a 3-day cultural and culinary itinerary for Kyoto with a moderate budget."
    )

    print(f"\n==========================================")
    print(f"🚀 Groq Orchestrator Starting")
    print(f"📌 Model: {GroqOrchestratorConfig().model}")
    print(f"📝 Prompt: {prompt}")
    print(f"==========================================\n")

    try:
        orchestrator = GroqOrchestrator()
        orchestrator.execute_and_print(prompt)
    except Exception as e:
        print(f"\n❌ Execution Error: {e}", file=sys.stderr)
        sys.exit(1)
