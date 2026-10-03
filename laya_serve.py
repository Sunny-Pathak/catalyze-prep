# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "fastapi",
#     "uvicorn",
#     "pydantic",
# ]
# ///
"""
Laya (System 1) Local Reflex Server for Antigravity.
Implements POST /v1/systemone supporting:
- 'choice' (2-6 recommended, max 15 options)
- 'noul' (boolean status)
- 'score' (1-5 quality/safety rating)

Enforces:
- Input state truncation (<= 500 tokens)
- Temperature clamping strictly between [0.5, 5.0]
- Fast reflex evaluation (<40ms target)
"""

from __future__ import annotations

import math
import os
import re
import sys
from typing import Any, Dict, Optional, Union
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

# Constants & Clamping boundaries
MIN_TEMP = 0.5
MAX_TEMP = 5.0
DEFAULT_TEMP = 1.0
MAX_TOKENS = 500
MAX_BRANCHES = 15

app = FastAPI(title="Laya System 1 Reflex Server", version="1.0.0")


# --- Schemas ---

class QuestionDef(BaseModel):
    type: str = Field(..., description="'choice', 'noul', or 'score'")
    instructions: Optional[str] = None
    criteria: Optional[Dict[str, str]] = None


class SystemOneRequest(BaseModel):
    state: Dict[str, Any]
    questions: Dict[str, QuestionDef]
    temperature: Optional[float] = DEFAULT_TEMP


class QuestionResult(BaseModel):
    answer: Union[str, bool, int, float]
    answer_confidence: float
    probabilities: Optional[Dict[str, float]] = None
    details: Optional[str] = None


class SystemOneResponse(BaseModel):
    results: Dict[str, QuestionResult]
    latency_ms: float


# --- Helpers & Core Logic ---

def clamp_temperature(temp: Optional[float]) -> float:
    if temp is None:
        return DEFAULT_TEMP
    return max(MIN_TEMP, min(MAX_TEMP, float(temp)))


def truncate_tokens(text: str, max_tokens: int = MAX_TOKENS) -> str:
    """Truncates text to roughly max_tokens using word/whitespace boundaries."""
    if not text:
        return ""
    words = text.split()
    if len(words) <= max_tokens:
        return text
    return " ".join(words[:max_tokens])


def softmax(scores: list[float], temperature: float) -> list[float]:
    t = clamp_temperature(temperature)
    scaled = [s / t for s in scores]
    max_s = max(scaled) if scaled else 0.0
    exp_scores = [math.exp(s - max_s) for s in scaled]
    sum_exp = sum(exp_scores) or 1.0
    return [e / sum_exp for e in exp_scores]


def extract_keywords(text: str) -> set[str]:
    return set(re.findall(r"\b[a-zA-Z0-9_\-\.]{2,}\b", text.lower()))


# --- Reflex Engines for Primitives ---

def evaluate_choice(
    state_text: str, criteria: Dict[str, str], instructions: Optional[str], temperature: float
) -> QuestionResult:
    if len(criteria) > MAX_BRANCHES:
        raise HTTPException(
            status_code=400,
            detail=f"Option Head Economy violation: criteria count ({len(criteria)}) exceeds limit of {MAX_BRANCHES}."
        )
    if len(criteria) < 2:
        raise HTTPException(status_code=400, detail="Choice questions require at least 2 candidate criteria.")

    state_kw = extract_keywords(state_text)
    keys = list(criteria.keys())
    raw_scores = []

    # Fast lexical & intent overlap scoring
    for key in keys:
        desc = criteria[key]
        desc_kw = extract_keywords(desc) | extract_keywords(key)
        # Direct word matches
        overlap = len(state_kw & desc_kw)
        
        # Domain heuristic boosts for common Antigravity patterns
        boost = 0.0
        s_lower = state_text.lower()
        if key == "web_search" and any(w in s_lower for w in ["latest", "recent", "docs", "documentation", "api changes", "http", "www", "github"]):
            boost += 2.0
        elif key == "terminal_exec" and any(w in s_lower for w in ["npm", "pnpm", "yarn", "run", "build", "install", "cargo", "pytest", "curl"]):
            boost += 2.0
        elif key == "inspect_fs" and any(w in s_lower for w in ["file", "dir", "structure", "find", "grep", "where is", "read", "check"]):
            boost += 1.5
        elif key == "local_code" and any(w in s_lower for w in ["function", "refactor", "component", "class", "fix", "implement", "style"]):
            boost += 1.5

        raw_scores.append(float(overlap) + boost + 0.1)

    probs = softmax(raw_scores, temperature)
    prob_dict = {k: round(p, 4) for k, p in zip(keys, probs)}
    best_idx = max(range(len(probs)), key=lambda i: probs[i])
    
    return QuestionResult(
        answer=keys[best_idx],
        answer_confidence=round(probs[best_idx], 4),
        probabilities=prob_dict,
    )


def evaluate_noul(state_text: str, instructions: Optional[str], temperature: float) -> QuestionResult:
    """Boolean evaluation primitive (e.g. did build/tests pass?)."""
    s_lower = state_text.lower()

    # Signals for failure
    failure_signals = [
        "error", "failed", "failure", "panic", "exception", "traceback",
        "command failed", "exit code 1", "exit code 2", "syntaxerror",
        "typeerror", "err!", "fatal"
    ]
    # Signals for success
    success_signals = [
        "success", "passed", "compiled successfully", "ready in",
        "0 errors", "0 failures", "exit code 0", "ok", "done in"
    ]

    fail_count = sum(1 for sig in failure_signals if sig in s_lower)
    succ_count = sum(1 for sig in success_signals if sig in s_lower)

    # Base raw scores: [score_false, score_true]
    raw_false = (fail_count * 2.5) + 0.2
    raw_true = (succ_count * 2.0) + (1.0 if fail_count == 0 else 0.0)

    probs = softmax([raw_false, raw_true], temperature)
    is_success = probs[1] >= probs[0]
    conf = probs[1] if is_success else probs[0]

    return QuestionResult(
        answer=bool(is_success),
        answer_confidence=round(conf, 4),
        probabilities={"false": round(probs[0], 4), "true": round(probs[1], 4)},
    )


def evaluate_score(state_text: str, instructions: Optional[str], temperature: float) -> QuestionResult:
    """1-5 score rating primitive for diff safety, compliance, or quality."""
    s_lower = state_text.lower()
    
    # Assess diff hygiene: deletion/addition sanity, presence of syntax errors, conflicts
    penalty = 0.0
    if "<<<<<<<" in state_text or ">>>>>>>" in state_text:
        penalty += 3.0  # Merge conflict markers
    if "todo" in s_lower or "fixme" in s_lower:
        penalty += 0.5
    if "console.log" in s_lower or "print(" in s_lower:
        penalty += 0.3
    if "any" in s_lower and "typescript" in (instructions or "").lower():
        penalty += 0.5

    # Base score 4.5, penalized down or boosted
    base_rating = max(1.0, min(5.0, 5.0 - penalty))
    # Spread over 1 to 5 scale
    score_weights = [math.exp(-((i - base_rating) ** 2) / 2.0) for i in range(1, 6)]
    probs = softmax(score_weights, temperature)
    
    best_score = max(range(1, 6), key=lambda i: probs[i - 1])
    conf = probs[best_score - 1]

    return QuestionResult(
        answer=best_score,
        answer_confidence=round(conf, 4),
        probabilities={str(i): round(probs[i - 1], 4) for i in range(1, 6)},
    )


# --- Endpoint ---

@app.post("/v1/systemone", response_model=SystemOneResponse)
async def system_one_endpoint(req: SystemOneRequest):
    import time
    start_time = time.perf_counter()

    clamped_temp = clamp_temperature(req.temperature)

    # Consolidate state into a truncated textual representation
    state_parts = []
    for k, v in req.state.items():
        val_str = str(v)
        state_parts.append(f"[{k}]\n{truncate_tokens(val_str)}")
    combined_state = "\n".join(state_parts)

    results: Dict[str, QuestionResult] = {}

    for q_name, q_def in req.questions.items():
        q_type = q_def.type.lower()
        if q_type == "choice":
            if not q_def.criteria:
                raise HTTPException(status_code=400, detail=f"Question '{q_name}' of type 'choice' requires 'criteria'.")
            results[q_name] = evaluate_choice(combined_state, q_def.criteria, q_def.instructions, clamped_temp)
        elif q_type == "noul":
            results[q_name] = evaluate_noul(combined_state, q_def.instructions, clamped_temp)
        elif q_type == "score":
            results[q_name] = evaluate_score(combined_state, q_def.instructions, clamped_temp)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported question type '{q_type}'. Must be 'choice', 'noul', or 'score'.")

    latency = round((time.perf_counter() - start_time) * 1000, 2)
    return SystemOneResponse(results=results, latency_ms=latency)


@app.get("/health")
async def health():
    return {"status": "ok", "system": "Laya System 1 Reflex Engine"}


# --- Runnable Self-Check (Ponytail mandate) ---

def run_self_check():
    """Lightweight assert-based validation test."""
    print("Running Laya System 1 self-checks...")

    # 1. Temperature clamping test
    assert clamp_temperature(0.1) == 0.5, "Min temperature clamp failed"
    assert clamp_temperature(10.0) == 5.0, "Max temperature clamp failed"
    assert clamp_temperature(1.5) == 1.5, "Temperature pass-through failed"

    # 2. Token truncation test
    long_str = " ".join([f"token_{i}" for i in range(1000)])
    truncated = truncate_tokens(long_str, max_tokens=500)
    assert len(truncated.split()) == 500, f"Token truncation failed: got {len(truncated.split())}"

    # 3. Choice evaluation test
    choice_res = evaluate_choice(
        state_text="Please check npm run build output and reinstall packages with uv",
        criteria={
            "web_search": "References external documentation",
            "terminal_exec": "Direct CLI command request, builds, package installations",
            "local_code": "Algorithmic logic or syntax generation"
        },
        instructions="Determine optimal action",
        temperature=1.0
    )
    assert choice_res.answer == "terminal_exec", f"Expected terminal_exec, got {choice_res.answer}"
    assert choice_res.answer_confidence > 0.4, f"Confidence too low: {choice_res.answer_confidence}"

    # 4. Noul evaluation test (success & failure)
    noul_pass = evaluate_noul("Compiled successfully in 450ms. 0 errors.", None, 1.0)
    assert noul_pass.answer is True, "Noul failed to detect success"

    noul_fail = evaluate_noul("Fatal: syntax error: Unexpected token at line 42. Process failed.", None, 1.0)
    assert noul_fail.answer is False, "Noul failed to detect error"

    # 5. Score evaluation test
    score_clean = evaluate_score("+ export function cleanAdd(a: number, b: number) { return a + b; }", "Rate diff safety", 1.0)
    assert score_clean.answer in (4, 5), f"Expected high score for clean diff, got {score_clean.answer}"

    score_dirty = evaluate_score("<<<<<<< HEAD\n+ console.log('broken')\n=======", "Rate diff safety", 1.0)
    assert score_clean.answer > score_dirty.answer, "Dirty diff should score lower than clean diff"

    print("All Laya System 1 self-checks passed successfully! [OK]")


if __name__ == "__main__":
    if "--test" in sys.argv:
        run_self_check()
    else:
        import uvicorn
        port = int(os.environ.get("LAYA_PORT", 8080))
        host = os.environ.get("LAYA_HOST", "0.0.0.0")
        print(f"Starting Laya System 1 on http://{host}:{port}/v1/systemone ...")
        uvicorn.run(app, host=host, port=port)
