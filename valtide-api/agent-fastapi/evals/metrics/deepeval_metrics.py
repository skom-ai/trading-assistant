"""DeepEval custom-metric wrappers over the deterministic checks.

File: evals/metrics/deepeval_metrics.py
Author: Sunil+Ai Assistant
Date: 2026-09-24
Description:
    Thin DeepEval BaseMetric adapters so the deterministic checks in
    deterministic.py can run inside DeepEval's evaluate()/assert_test flow
    and appear in DeepEval reports. Each metric reads the structured model
    output from LLMTestCase.additional_metadata["structured"] (DeepEval's
    actual_output stays a human-readable string).

    DeepEval is a DEV/eval-only dependency (see evals/requirements-evals.txt);
    this module imports it lazily so importing the package without DeepEval
    installed does not explode — the plain-pytest path in test_evals.py still
    works via deterministic.py directly.

    LLM-as-judge metrics (citation faithfulness, rationale relevancy) are
    provided by DeepEval's own GEval; construct them in the eval file with a
    pinned judge model (see README §Judge hygiene).
"""
from __future__ import annotations

from typing import Callable

try:  # DeepEval is optional at import time.
    from deepeval.metrics import BaseMetric
    from deepeval.test_case import LLMTestCase

    _HAS_DEEPEVAL = True
except Exception:  # pragma: no cover - exercised only without deepeval
    _HAS_DEEPEVAL = False

    class BaseMetric:  # type: ignore[no-redef]
        """Minimal stand-in so the module imports without DeepEval."""

        threshold: float = 1.0
        score: float = 0.0
        success: bool = False
        reason: str = ""

    class LLMTestCase:  # type: ignore[no-redef]
        """Stand-in LLMTestCase (only additional_metadata is read)."""

        additional_metadata: dict = {}


class _DeterministicMetric(BaseMetric):
    """Wrap a (dict)->(passed, reason) check as a pass/fail DeepEval metric.

    The check is a hard gate: threshold is 1.0, score is 1.0 on pass else 0.0.
    """

    def __init__(self, name: str, check: Callable[[dict], tuple[bool, str]]) -> None:
        """Initialize the metric.

        Args:
            name: Human-readable metric name for reports.
            check: A callable over the structured output returning
                (passed, reason).
        """
        self._name = name
        self._check = check
        self.threshold = 1.0

    def measure(self, test_case: "LLMTestCase") -> float:
        """Run the check against the structured output on the test case.

        Args:
            test_case: DeepEval test case; structured output is read from
                ``additional_metadata['structured']``.

        Returns:
            1.0 on pass, 0.0 on fail (also sets score/success/reason).
        """
        structured = (test_case.additional_metadata or {}).get("structured", {})
        passed, reason = self._check(structured)
        self.score = 1.0 if passed else 0.0
        self.success = passed
        self.reason = reason
        return self.score

    async def a_measure(self, test_case: "LLMTestCase") -> float:
        """Async entrypoint required by DeepEval; delegates to measure."""
        return self.measure(test_case)

    def is_successful(self) -> bool:
        """Return whether the last measurement passed."""
        return self.success

    @property
    def __name__(self) -> str:  # DeepEval reads this for report labels.
        """Return the metric label used in DeepEval reports."""
        return self._name


def deterministic_metric(name: str,
                         check: Callable[[dict], tuple[bool, str]]) -> _DeterministicMetric:
    """Factory for a hard-gate deterministic DeepEval metric.

    Args:
        name: Metric label.
        check: (structured_output_dict) -> (passed, reason).

    Returns:
        A configured _DeterministicMetric.
    """
    return _DeterministicMetric(name, check)


def has_deepeval() -> bool:
    """Report whether DeepEval is importable in this environment."""
    return _HAS_DEEPEVAL
