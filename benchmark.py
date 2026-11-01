"""Benchmark orchestration and timing for the Algorithm Performance Dashboard."""

from __future__ import annotations

import math
import random
import statistics
import time
from datetime import datetime, timezone
from typing import Any, Callable
from uuid import uuid4

from algorithms import (
    ALGORITHM_ORDER,
    ALGORITHMS,
    QUADRATIC_ALGORITHMS,
    SEARCH_FUNCTIONS,
    SORTING_FUNCTIONS,
)


DEFAULT_Q = 1.0
CASE_ORDER = ("best", "average", "worst")
CASE_LABELS = {
    "best": "Best case",
    "average": "Average case",
    "worst": "Worst case",
}
MAX_INPUT_VALUES = 20_000

# Workload sizes. Choosing a larger upper bound makes a chart more meaningful,
# but quadratic sorts become prohibitively slow in pure Python.
SIZE_PROFILES = {
    "quadratic": {
        "points": (10, 25, 50, 100, 200, 350, 500),
        "max_size": 500,
    },
    "sorting": {
        "points": (10, 40, 100, 300, 700, 1_500, 3_000),
        "max_size": 3_000,
    },
    "searching": {
        "points": (10, 100, 500, 2_000, 6_000, 12_000, 20_000),
        "max_size": 20_000,
    },
}

SORT_BUDGET_NS = 35_000_000
SEARCH_BATCH_BUDGET_NS = 4_000_000
ABSENT_TARGET = math.inf


class BenchmarkError(ValueError):
    """Raised when a benchmark request is invalid."""


def average_with_absence(n: int, q: float) -> float:
    """Expected comparisons for a linear search when absence has probability q.

    This is the model supplied with the dashboard specification:
    (1 - q) * (n + 1) / 2 + q * n.
    """
    return (1.0 - q) * (n + 1.0) / 2.0 + q * n


def _validate_values(raw_values: Any) -> list[float]:
    if not isinstance(raw_values, list) or not raw_values:
        raise BenchmarkError("Enter at least one numeric dataset value.")

    if len(raw_values) > MAX_INPUT_VALUES:
        raise BenchmarkError(
            f"Too many values. The dashboard accepts up to {MAX_INPUT_VALUES:,} values per run."
        )

    values: list[float] = []
    for index, raw_value in enumerate(raw_values):
        if isinstance(raw_value, bool) or not isinstance(raw_value, (int, float)):
            raise BenchmarkError(f"Dataset item {index + 1} is not a valid number.")
        try:
            value = float(raw_value)
        except (TypeError, OverflowError):
            raise BenchmarkError(f"Dataset item {index + 1} is not a valid number.") from None
        if not math.isfinite(value):
            raise BenchmarkError(f"Dataset item {index + 1} must be a finite number.")
        values.append(value)

    return values


def _validate_algorithms(raw_algorithms: Any) -> list[str]:
    if not isinstance(raw_algorithms, list) or not raw_algorithms:
        raise BenchmarkError("Select at least one algorithm to benchmark.")

    if any(not isinstance(algorithm_id, str) for algorithm_id in raw_algorithms):
        raise BenchmarkError("Algorithms must be provided as identifiers.")

    requested = set(raw_algorithms)
    unknown = requested.difference(ALGORITHMS)
    if unknown:
        raise BenchmarkError(f"Unknown algorithm: {sorted(unknown)[0]}.")

    return [algorithm_id for algorithm_id in ALGORITHM_ORDER if algorithm_id in requested]


def _validate_cases(raw_cases: Any) -> list[str]:
    if not isinstance(raw_cases, list) or not raw_cases:
        raise BenchmarkError("Select at least one case: best, average, or worst.")

    if any(not isinstance(case, str) for case in raw_cases):
        raise BenchmarkError("Cases must be provided as identifiers.")

    requested = set(raw_cases)
    unknown = requested.difference(CASE_ORDER)
    if unknown:
        raise BenchmarkError(f"Unknown case: {sorted(unknown)[0]}.")

    return [case for case in CASE_ORDER if case in requested]


def _validate_q(raw_q: Any) -> tuple[float, bool]:
    """Return (q, was_defaulted). A missing or blank q defaults to 1."""
    if raw_q is None or raw_q == "":
        return DEFAULT_Q, True

    if isinstance(raw_q, bool):
        raise BenchmarkError("Q must be a number between 0 and 1.")

    try:
        q = float(raw_q)
    except (TypeError, ValueError):
        raise BenchmarkError("Q must be a number between 0 and 1.") from None

    if not math.isfinite(q) or q < 0 or q > 1:
        raise BenchmarkError("Q must be a number between 0 and 1.")

    return q, False


def _size_series(effective_length: int, profile_name: str) -> list[int]:
    profile = SIZE_PROFILES[profile_name]
    sizes = {size for size in profile["points"] if size <= profile["max_size"]}
    sizes.add(effective_length)

    # Keep the workload sample at the user's own input length when possible.
    sizes = sorted(size for size in sizes if 0 < size <= profile["max_size"])
    if not sizes:
        sizes = [min(max(effective_length, 1), profile["max_size"])]
    return sizes


def _sample_dataset(values: list[float], max_size: int) -> tuple[list[float], bool]:
    """Evenly sample a very large dataset so a benchmark stays responsive."""
    if len(values) <= max_size:
        return values, False

    if max_size == 1:
        return [values[0]], True

    last_index = len(values) - 1
    sampled = [
        values[round(index * last_index / (max_size - 1))]
        for index in range(max_size)
    ]
    return sampled, True


def _build_dataset_cache(
    base_values: list[float],
    sizes: list[int],
    cases: list[str],
    categories: set[str],
) -> dict[tuple[str, str, int], list[float]]:
    """Build each case workload once and share it across algorithms.

    For sizes beyond the supplied dataset, values are extended with tiny
    deterministic offsets. The offsets preserve the character of the user's
    data while avoiding mass duplicates that would distort present-target
    search timings.
    """
    cache: dict[tuple[str, str, int], list[float]] = {}
    base_length = len(base_values)
    spread = max(base_values) - min(base_values)

    def extended_values(size: int) -> list[float]:
        if size <= base_length:
            return base_values[:size]
        step = max(spread, 1.0) / (max(size, 2) * 2.0)
        return [
            base_values[index % base_length] + index * step
            for index in range(size)
        ]

    for size in sizes:
        raw = extended_values(size)

        if "sorting" in categories:
            ordered = sorted(raw)
            for case in cases:
                if case == "best":
                    cache[("sorting", case, size)] = ordered
                elif case == "worst":
                    cache[("sorting", case, size)] = ordered[::-1]
                else:
                    shuffled = raw[:]
                    random.Random(0xC0FFEE + size * 7919).shuffle(shuffled)
                    cache[("sorting", case, size)] = shuffled

        if "searching" in categories:
            # Binary search needs a sorted search space. Both search
            # algorithms share it so the comparison is fair.
            sorted_raw = sorted(raw)
            for case in cases:
                cache[("searching", case, size)] = sorted_raw

    return cache


def _measure_sorting(function: Callable[[list[float]], Any], data: list[float]) -> float:
    """Measure wall-clock sort time in milliseconds using median runs."""
    samples: list[int] = []

    work = list(data)
    started = time.perf_counter_ns()
    function(work)
    elapsed = time.perf_counter_ns() - started
    samples.append(elapsed)

    extra_runs = max(0, SORT_BUDGET_NS // max(elapsed, 1) - 1)
    if elapsed < 8_000_000:
        extra_runs = max(extra_runs, 1)
    extra_runs = min(extra_runs, 20)

    for _ in range(extra_runs):
        work = list(data)
        started = time.perf_counter_ns()
        function(work)
        elapsed = time.perf_counter_ns() - started
        samples.append(elapsed)

    return round(statistics.median(samples) / 1_000_000, 6)


def _measure_search_strategy(
    function: Callable[[list[float], float], int],
    data: list[float],
    algorithm_id: str,
    size: int,
    strategy: str,
    q: float,
) -> float:
    """Measure one search-target strategy in milliseconds.

    Several call-batches are timed and their median per-call cost is returned.
    A probe batch determines the batch size without polluting the samples.
    """
    seed = (
        0x5EED
        ^ (size * 2654435761)
        ^ (int(q * 1_000_000) * 97)
        ^ sum(ord(character) for character in algorithm_id) * 17
        ^ (0 if strategy == "best" else 4297 if strategy == "absent" else 8191)
    )
    rng = random.Random(seed)

    if strategy == "best":
        target = data[len(data) // 2] if algorithm_id == "binary_search" else data[0]

        def pick_target() -> float:
            return target

    elif strategy == "absent":

        def pick_target() -> float:
            return ABSENT_TARGET

    else:

        def pick_target() -> float:
            return data[rng.randrange(len(data))]

    def run_batch(count: int) -> tuple[int, int]:
        targets = [pick_target() for _ in range(count)]
        started = time.perf_counter_ns()
        for search_target in targets:
            function(data, search_target)
        return time.perf_counter_ns() - started, count

    # Probe only -- this sample is deliberately discarded.
    probe_elapsed, probe_count = run_batch(100)
    per_call = max(probe_elapsed / probe_count, 1.0)
    batch_count = int(SEARCH_BATCH_BUDGET_NS / per_call)
    batch_count = max(80, min(3_000, batch_count))

    samples = []
    for _ in range(5):
        elapsed, count = run_batch(batch_count)
        samples.append(elapsed / count)

    return statistics.median(samples) / 1_000_000


def _measure_search(
    function: Callable[[list[float], float], int],
    data: list[float],
    case: str,
    q: float,
    algorithm_id: str,
    size: int,
) -> float:
    """Measure search cost in milliseconds.

    Average-case timing is the probability-weighted blend of present-target and
    absent-target measurements. Weighting those two empirical costs by Q turns
    the target-absence probability directly into the benchmarked execution time.
    """
    if case == "best":
        milliseconds = _measure_search_strategy(
            function, data, algorithm_id, size, "best", q
        )
    elif case == "worst":
        milliseconds = _measure_search_strategy(
            function, data, algorithm_id, size, "absent", q
        )
    else:
        if q >= 1.0:
            milliseconds = _measure_search_strategy(
                function, data, algorithm_id, size, "absent", q
            )
        elif q <= 0.0:
            milliseconds = _measure_search_strategy(
                function, data, algorithm_id, size, "present", q
            )
        else:
            present_ms = _measure_search_strategy(
                function, data, algorithm_id, size, "present", q
            )
            absent_ms = _measure_search_strategy(
                function, data, algorithm_id, size, "absent", q
            )
            milliseconds = (1.0 - q) * present_ms + q * absent_ms

    return round(milliseconds, 6)


def _profile_for(algorithm_ids: list[str]) -> tuple[str, set[str]]:
    categories = {ALGORITHMS[algorithm_id]["category"] for algorithm_id in algorithm_ids}
    has_quadratic = any(algorithm_id in QUADRATIC_ALGORITHMS for algorithm_id in algorithm_ids)

    if "sorting" in categories and has_quadratic:
        return "quadratic", categories
    if "sorting" in categories:
        return "sorting", categories
    return "searching", categories


def _make_notes(
    *,
    q: float,
    q_defaulted: bool,
    original_length: int,
    effective_length: int,
    sizes: list[int],
    cases: list[str],
    categories: set[str],
    profile_name: str,
) -> list[dict[str, str]]:
    notes: list[dict[str, str]] = []
    benchmark_size = sizes[-1]

    if original_length > effective_length:
        notes.append(
            {
                "type": "warning",
                "text": (
                    f"Your dataset has {original_length:,} values; this run evenly samples "
                    f"{effective_length:,} of them to keep quadratic benchmarks responsive."
                ),
            }
        )

    if benchmark_size > effective_length:
        notes.append(
            {
                "type": "info",
                "text": (
                    f"Input sizes above {effective_length:,} extend the supplied values with "
                    "deterministic offsets to model how each algorithm scales."
                ),
            }
        )

    if "searching" in categories:
        notes.append(
            {
                "type": "info",
                "text": (
                    "Search benchmarks use sorted copies of the data because Binary Search "
                    "requires an ordered input."
                ),
            }
        )

        if "average" in cases:
            if q_defaulted:
                q_text = "Q was left blank and defaults to 1"
            else:
                q_text = f"Q = {q:.2f}"
            notes.append(
                {
                    "type": "info",
                    "text": (
                        f"{q_text}; average-case search time is a Q-weighted blend of "
                        "present-target and absent-target runs."
                    ),
                }
            )
        else:
            notes.append(
                {
                    "type": "info",
                    "text": "Average case was not selected, so Q was not applied in this run.",
                }
            )

    if profile_name == "quadratic":
        notes.append(
            {
                "type": "info",
                "text": (
                    "A quadratic algorithm is selected, so input sizes stop at 500 to keep the "
                    "Python benchmark responsive."
                ),
            }
        )

    return notes


def run_benchmark(payload: dict[str, Any]) -> dict[str, Any]:
    """Validate a request and run the requested algorithms and cases."""
    if not isinstance(payload, dict):
        raise BenchmarkError("The benchmark request must be a JSON object.")

    values = _validate_values(payload.get("values"))
    algorithm_ids = _validate_algorithms(payload.get("algorithms"))
    cases = _validate_cases(payload.get("cases"))
    q, q_defaulted = _validate_q(payload.get("q"))

    profile_name, categories = _profile_for(algorithm_ids)
    max_size = SIZE_PROFILES[profile_name]["max_size"]

    effective_values, was_sampled = _sample_dataset(values, max_size)
    sizes = _size_series(len(effective_values), profile_name)
    dataset_cache = _build_dataset_cache(effective_values, sizes, cases, categories)

    started = time.perf_counter_ns()
    results: dict[str, Any] = {}

    for algorithm_id in algorithm_ids:
        metadata = ALGORITHMS[algorithm_id]
        category = metadata["category"]
        case_results: dict[str, Any] = {}

        for case in cases:
            series: list[dict[str, float | int]] = []

            for size in sizes:
                data = dataset_cache[(category, case, size)]

                if category == "sorting":
                    function = SORTING_FUNCTIONS[algorithm_id]
                    milliseconds = _measure_sorting(function, data)
                else:
                    function = SEARCH_FUNCTIONS[algorithm_id]
                    milliseconds = _measure_search(
                        function, data, case, q, algorithm_id, size
                    )

                series.append({"n": size, "ms": milliseconds})

            case_results[case] = {
                "series": series,
                "at": series[-1],
            }

        results[algorithm_id] = {
            "id": algorithm_id,
            "name": metadata["name"],
            "short_name": metadata["short_name"],
            "category": category,
            "color": metadata["color"],
            "complexity": metadata["complexity"],
            "description": metadata["description"],
            "cases": case_results,
        }

    duration_ms = (time.perf_counter_ns() - started) / 1_000_000
    benchmark_size = sizes[-1]
    notes = _make_notes(
        q=q,
        q_defaulted=q_defaulted,
        original_length=len(values),
        effective_length=len(effective_values),
        sizes=sizes,
        cases=cases,
        categories=categories,
        profile_name=profile_name,
    )

    return {
        "run_id": uuid4().hex[:12],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "meta": {
            "duration_ms": round(duration_ms, 2),
            "q": q,
            "q_defaulted": q_defaulted,
            "input_length": len(values),
            "effective_input_length": len(effective_values),
            "was_sampled": was_sampled,
            "benchmark_size": benchmark_size,
            "sizes": sizes,
            "algorithms": algorithm_ids,
            "cases": cases,
            "categories": sorted(categories),
            "profile": profile_name,
            "timing": {
                "clock": "time.perf_counter_ns",
                "sorting": "median of repeated timed runs",
                "searching": "median of batched timed calls",
                "average_search": "Q-weighted blend of present and absent target measurements",
            },
            "notes": notes,
        },
        "algorithms": results,
        "search_model": {
            "n": benchmark_size,
            "q": q,
            "present_probability": round(1.0 - q, 6),
            "absent_probability": q,
            "linear_expected_comparisons": round(average_with_absence(benchmark_size, q), 4),
            "average_case_included": "average" in cases,
        },
    }
