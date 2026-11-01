import json
import unittest

from app import app
from benchmark import BenchmarkError, run_benchmark


DEFAULT_VALUES = [38, 27, 43, 3, 9, 82, 10, 55, 71, 14, 63, 29, 88, 4, 46, 97]


class BenchmarkEngineTests(unittest.TestCase):
    def test_default_q_is_one(self):
        result = run_benchmark(
            {
                "values": DEFAULT_VALUES,
                "algorithms": ["linear_search"],
                "cases": ["average"],
            }
        )
        self.assertEqual(result["meta"]["q"], 1.0)
        self.assertTrue(result["meta"]["q_defaulted"])
        self.assertAlmostEqual(result["search_model"]["present_probability"], 0.0)

    def test_response_shape_and_sizes(self):
        result = run_benchmark(
            {
                "values": DEFAULT_VALUES,
                "algorithms": ["linear_search", "binary_search"],
                "cases": ["best", "average", "worst"],
                "q": 0.5,
            }
        )
        meta = result["meta"]
        self.assertIn(16, meta["sizes"])
        self.assertEqual(meta["benchmark_size"], max(meta["sizes"]))
        self.assertEqual(meta["profile"], "searching")
        self.assertEqual(set(result["algorithms"]), {"linear_search", "binary_search"})
        for algorithm in result["algorithms"].values():
            self.assertEqual(set(algorithm["cases"]), {"best", "average", "worst"})
            for case in algorithm["cases"].values():
                self.assertEqual(len(case["series"]), len(meta["sizes"]))
                self.assertTrue(all(point["ms"] >= 0 for point in case["series"]))

        expected = (1 - 0.5) * (meta["benchmark_size"] + 1) / 2 + 0.5 * meta["benchmark_size"]
        self.assertAlmostEqual(
            result["search_model"]["linear_expected_comparisons"],
            round(expected, 4),
        )

    def test_oversized_dataset_is_evenly_sampled(self):
        values = list(range(800))
        result = run_benchmark(
            {
                "values": values,
                "algorithms": ["bubble_sort"],
                "cases": ["best"],
                "q": 1,
            }
        )
        self.assertTrue(result["meta"]["was_sampled"])
        self.assertEqual(result["meta"]["effective_input_length"], 500)
        self.assertEqual(result["meta"]["input_length"], 800)
        self.assertEqual(result["meta"]["sizes"][-1], 500)
        self.assertTrue(any(note["type"] == "warning" for note in result["meta"]["notes"]))

    def test_invalid_requests(self):
        base = {
            "values": [3, 1, 2],
            "algorithms": ["heap_sort"],
            "cases": ["best"],
            "q": 1,
        }

        invalid_payloads = [
            {**base, "values": []},
            {**base, "values": ["one"]},
            {**base, "values": [float("inf")]},
            {**base, "algorithms": []},
            {**base, "algorithms": ["not_real"]},
            {**base, "cases": []},
            {**base, "q": -0.1},
            {**base, "q": 1.5},
            {**base, "q": "not-a-number"},
        ]

        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                with self.assertRaises(BenchmarkError):
                    run_benchmark(payload)


class ApiTests(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True)
        self.client = app.test_client()

    def test_page_loads(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Algorithm Performance Benchmark Dashboard", response.data)
        self.assertIn(b"Complexity Overview", response.data)

    def test_health(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "ok")

    def test_benchmark_endpoint(self):
        response = self.client.post(
            "/api/benchmark",
            json={
                "values": DEFAULT_VALUES,
                "algorithms": ["bubble_sort", "binary_search"],
                "cases": ["best", "average"],
                "q": 0.25,
            },
        )
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["meta"]["q"], 0.25)
        self.assertEqual(payload["meta"]["profile"], "quadratic")
        self.assertIn("bubble_sort", payload["algorithms"])

    def test_benchmark_endpoint_rejects_bad_payload(self):
        response = self.client.post(
            "/api/benchmark",
            json={"values": [], "algorithms": [], "cases": []},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.get_json())

    def test_benchmark_endpoint_requires_json(self):
        response = self.client.post("/api/benchmark", data="not json")
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
