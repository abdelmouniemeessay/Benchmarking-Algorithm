import random
import unittest

from algorithms import (
    ALGORITHMS,
    SEARCH_FUNCTIONS,
    SORTING_FUNCTIONS,
    binary_search,
    linear_search,
)
from benchmark import average_with_absence


class SortingAlgorithmTests(unittest.TestCase):
    def test_all_sorters_order_random_data(self):
        rng = random.Random(2026)
        cases = [
            [],
            [1],
            [2, 1],
            [3, 3, 3, 3],
            [5, -2, 0, -9, 11, 4, 4],
            [rng.randint(-100, 100) for _ in range(120)],
            list(range(80)),
            list(range(80, 0, -1)),
        ]

        for algorithm_id, function in SORTING_FUNCTIONS.items():
            for original in cases:
                with self.subTest(algorithm=algorithm_id, size=len(original)):
                    work = original[:]
                    returned = function(work)
                    result = returned if returned is not None else work
                    self.assertEqual(result, sorted(original))

    def test_merge_sort_does_not_mutate_input(self):
        data = [4, 1, 3, 2]
        result = SORTING_FUNCTIONS["merge_sort"](data)
        self.assertEqual(data, [4, 1, 3, 2])
        self.assertEqual(result, [1, 2, 3, 4])


class SearchAlgorithmTests(unittest.TestCase):
    def test_linear_search(self):
        values = [1, 3, 5, 7, 9]
        for index, target in enumerate(values):
            self.assertEqual(linear_search(values, target), index)
        self.assertEqual(linear_search(values, 4), -1)
        self.assertEqual(linear_search([], 3), -1)

    def test_binary_search(self):
        values = [1, 3, 5, 7, 9, 11, 13]
        for index, target in enumerate(values):
            found = binary_search(values, target)
            self.assertNotEqual(found, -1)
            self.assertEqual(values[found], target)
        for target in (-1, 0, 2, 4, 14, 100):
            self.assertEqual(binary_search(values, target), -1)

    def test_search_registry_points_to_functions(self):
        self.assertIn("linear_search", SEARCH_FUNCTIONS)
        self.assertIn("binary_search", SEARCH_FUNCTIONS)
        self.assertEqual(len(ALGORITHMS), 8)


class SearchProbabilityTests(unittest.TestCase):
    def test_expected_comparisons(self):
        self.assertEqual(average_with_absence(100, 0.0), 50.5)
        self.assertEqual(average_with_absence(100, 1.0), 100.0)
        self.assertEqual(average_with_absence(100, 0.5), 75.25)
        self.assertEqual(average_with_absence(1, 0.5), 1.0)

    def test_probability_is_bounded(self):
        for n in (1, 10, 100, 500):
            previous = -1
            for step in range(21):
                q = step / 20
                value = average_with_absence(n, q)
                self.assertGreaterEqual(value, (n + 1) / 2 - 1e-12)
                self.assertLessEqual(value, n + 1e-12)
                self.assertGreaterEqual(value, previous)
                previous = value


if __name__ == "__main__":
    unittest.main()
