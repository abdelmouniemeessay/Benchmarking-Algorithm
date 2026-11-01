"""Flask entry point for the Algorithm Performance Benchmark Dashboard."""

from __future__ import annotations

import os

from flask import Flask, jsonify, render_template, request
from werkzeug.exceptions import RequestEntityTooLarge

from algorithms import (
    ALGORITHM_ORDER,
    ALGORITHMS,
    SEARCHING_ALGORITHMS,
    SORTING_ALGORITHMS,
)
from benchmark import (
    CASE_LABELS,
    DEFAULT_Q,
    MAX_INPUT_VALUES,
    BenchmarkError,
    run_benchmark,
)


DEFAULT_VALUES = (
    "38, 27, 43, 3, 9, 82, 10, 55, 71, 14, 63, 29, 88, 4, 46, 97"
)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 1 * 1024 * 1024
app.config["JSON_SORT_KEYS"] = False


@app.get("/")
def index():
    algorithms = [ALGORITHMS[algorithm_id] for algorithm_id in ALGORITHM_ORDER]
    app_config = {
        "algorithms": algorithms,
        "defaults": {
            "values": DEFAULT_VALUES,
            "q": DEFAULT_Q,
        },
        "limits": {
            "maxValues": MAX_INPUT_VALUES,
        },
        "labels": {
            "cases": CASE_LABELS,
        },
    }

    return render_template(
        "index.html",
        algorithms=algorithms,
        sorting_algorithms=[ALGORITHMS[algorithm_id] for algorithm_id in SORTING_ALGORITHMS],
        searching_algorithms=[ALGORITHMS[algorithm_id] for algorithm_id in SEARCHING_ALGORITHMS],
        default_values=DEFAULT_VALUES,
        app_config=app_config,
    )


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "engine": "python"})


@app.post("/api/benchmark")
def benchmark():
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"error": "Send a JSON request body to run a benchmark."}), 400

    try:
        result = run_benchmark(payload)
    except BenchmarkError as error:
        return jsonify({"error": str(error)}), 400
    except Exception:  # pragma: no cover - defensive guard for the local server
        app.logger.exception("Unexpected benchmark failure")
        return (
            jsonify(
                {
                    "error": (
                        "The Python benchmark engine hit an unexpected error. "
                        "Try a smaller dataset or fewer algorithms."
                    )
                }
            ),
            500,
        )

    return jsonify(result)


@app.errorhandler(RequestEntityTooLarge)
def request_too_large(_error):
    return jsonify({"error": "The request is too large. Reduce the dataset size."}), 413


@app.after_request
def add_headers(response):
    if request.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    print()
    print("  Algorithm Performance Benchmark Dashboard")
    print(f"  Running at http://127.0.0.1:{port}")
    print("  Press Ctrl+C to stop.")
    print()
    app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False)
