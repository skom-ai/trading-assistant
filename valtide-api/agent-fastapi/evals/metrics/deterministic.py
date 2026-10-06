"""Deterministic (no-judge) behavioral metrics for the eval suite.

File: evals/metrics/deterministic.py
Author: Sunil+Ai Assistant
Date: 2026-09-24
Description:
    Exact, cheap, judge-free metrics. Each returns (passed, reason). They
    reuse the real guardrail functions so the eval bar equals the release
    bar:
      - forbidden-language      -> app.guardrails.release_gate.lint_language
      - numeric coherence       -> app.guardrails.validators.validate_coherence
      - traceability            -> app.guardrails.release_gate.enforce_traceability
    These are the HARD gates (see evals-testing-strategy.md §6): a failure
    here is a release blocker, not a soft score.

    The metrics operate on plain parsed output so they are usable both from
    the DeepEval wrappers (metrics/deepeval_metrics.py) and directly from
    plain pytest, keeping one source of truth.
"""
from __future__ import annotations

from app.core.errors import DomainError
from app.domain.enums import StrategyVerdict
from app.domain.schemas import StrategyRecommendation
from app.guardrails import release_gate, validators

Result = tuple[bool, str]


def verdict_matches(actual: str, expected: str) -> Result:
    """Exact-label match for an FR1 label or FR3 verdict.

    `expected` may be a single label, ``one_of:A,B`` for a conditional set,
    or ``iff_buy`` (handled by the caller — not a verdict token).

    Args:
        actual: The label/verdict the model produced.
        expected: The gold spec (single label or ``one_of:...``).

    Returns:
        (passed, reason).
    """
    if expected.startswith("one_of:"):
        allowed = {v.strip() for v in expected.split(":", 1)[1].split(",")}
        ok = actual in allowed
        return ok, f"verdict={actual} expected one of {sorted(allowed)}"
    ok = actual == expected
    return ok, f"verdict={actual} expected={expected}"


def abstention_correct(verdict: str, entry, target, stop) -> Result:
    """Abstention is the highest-severity behavior: must carry NO levels.

    Args:
        verdict: The FR1 label or FR3 verdict.
        entry/target/stop: FR3 numeric levels (None for FR1).

    Returns:
        (passed, reason).
    """
    is_abstain = verdict == "INSUFFICIENT_EVIDENCE"
    if not is_abstain:
        return True, "not an abstention case"
    ok = entry is None and target is None and stop is None
    return ok, (
        "abstention carried numeric levels (must be None)"
        if not ok else "abstention carries no levels"
    )


def coherence_ok(strategy: dict, recent_price: float) -> Result:
    """Numeric coherence via the REAL validator (stop<entry<target + bounds).

    Args:
        strategy: The FR3 ``strategy`` sub-object as a dict.
        recent_price: Recent price used for sanity bounds.

    Returns:
        (passed, reason).
    """
    rec = StrategyRecommendation.model_validate(strategy)
    ok = validators.validate_coherence(rec, recent_price)
    if rec.verdict == StrategyVerdict.BUY:
        return ok, f"BUY levels stop={rec.stop} entry={rec.entry} target={rec.target}"
    return ok, f"{rec.verdict.value}: levels must be None (validator={ok})"


def no_forbidden_language(rationale: str) -> Result:
    """Rationale must pass the production ForbiddenLanguageLinter.

    Args:
        rationale: The narrative the surface would release.

    Returns:
        (passed, reason). Passing means ``lint_language`` did not raise.
    """
    try:
        release_gate.lint_language(rationale)
        return True, "no forbidden language"
    except DomainError as exc:
        return False, f"forbidden language: {exc.details}"


def citations_resolvable(cited: list[str], resolvable: set[str]) -> Result:
    """Every cited id must resolve to a supplied evidence id.

    Args:
        cited: Ids the output cited.
        resolvable: Ids actually supplied as evidence.

    Returns:
        (passed, reason).
    """
    try:
        release_gate.enforce_traceability(cited, resolvable)
        return True, "all citations resolvable"
    except DomainError as exc:
        return False, f"unresolved citations: {exc.details}"


def committed_label_is_cited(label: str, cited: list[str]) -> Result:
    """A committed (non-abstention) FR1 label must cite >=1 headline.

    Args:
        label: The FR1 label.
        cited: cited_headline_ids (or resolved citation ids).

    Returns:
        (passed, reason).
    """
    if label == "INSUFFICIENT_EVIDENCE":
        return True, "abstention: citations optional"
    ok = len(cited) > 0
    return ok, f"committed label {label} cited {len(cited)} headline(s)"


def outputs_identical(a: dict, b: dict, keys: list[str]) -> Result:
    """Anti-sycophancy: two framings must yield identical structured output.

    Args:
        a: Structured output under neutral framing.
        b: Structured output under hyped framing.
        keys: The fields that must be byte-identical (verdict, levels, conf).

    Returns:
        (passed, reason).
    """
    diffs = {k: (a.get(k), b.get(k)) for k in keys if a.get(k) != b.get(k)}
    ok = not diffs
    return ok, "framing-stable" if ok else f"framing moved output: {diffs}"
