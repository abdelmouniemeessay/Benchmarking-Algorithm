"""Pure-Python implementations of the benchmarked algorithms.

Each function uses comparisons and swaps only -- no built-in sorting shortcuts --
so the timings reflect the algorithm itself rather than library internals.
"""

from __future__ import annotations

from typing import Any


# ---------------------------------------------------------------------------
# Sorting algorithms
# ---------------------------------------------------------------------------

def heap_sort(values: list[Any]) -> None:
    """In-place heap sort with an optimized sift-down."""
    n = len(values)

    for root in range(n // 2 - 1, -1, -1):
        _sift_down(values, root, n)

    for end in range(n - 1, 0, -1):
        values[0], values[end] = values[end], values[0]
        _sift_down(values, 0, end)


def _sift_down(values: list[Any], root: int, end: int) -> None:
    while True:
        child = 2 * root + 1
        if child >= end:
            return
        right = child + 1
        if right < end and values[child] < values[right]:
            child = right
        if values[root] >= values[child]:
            return
        values[root], values[child] = values[child], values[root]
        root = child


def bubble_sort(values: list[Any]) -> None:
    """Bubble sort with an early-exit flag for already sorted input."""
    n = len(values)
    for end in range(n - 1, 0, -1):
        swapped = False
        for index in range(end):
            if values[index] > values[index + 1]:
                values[index], values[index + 1] = (
                    values[index + 1],
                    values[index],
                )
                swapped = True
        if not swapped:
            return


def merge_sort(values: list[Any]) -> list[Any]:
    """Stable top-down merge sort. Returns a new sorted list."""
    length = len(values)
    if length <= 1:
        return values[:]

    middle = length // 2
    left = merge_sort(values[:middle])
    right = merge_sort(values[middle:])

    merged: list[Any] = []
    left_index = 0
    right_index = 0
    left_length = len(left)
    right_length = len(right)
    append = merged.append

    while left_index < left_length and right_index < right_length:
        if left[left_index] <= right[right_index]:
            append(left[left_index])
            left_index += 1
        else:
            append(right[right_index])
            right_index += 1

    if left_index < left_length:
        merged.extend(left[left_index:])
    if right_index < right_length:
        merged.extend(right[right_index:])
    return merged


def quick_sort(values: list[Any]) -> None:
    """In-place quick sort with median-of-three pivots and a small cutoff.

    The smaller partition is always handled recursively while the larger one
    is processed iteratively, keeping stack depth logarithmic.
    """
    _quick_sort_range(values, 0, len(values) - 1)


def _quick_sort_range(values: list[Any], low: int, high: int) -> None:
    while low < high:
        if high - low < 14:
            _insertion_sort_range(values, low, high)
            return

        middle = (low + high) // 2

        # Median-of-three ordering: low <= middle <= high.
        if values[middle] < values[low]:
            values[middle], values[low] = values[low], values[middle]
        if values[high] < values[low]:
            values[high], values[low] = values[low], values[high]
        if values[high] < values[middle]:
            values[high], values[middle] = values[middle], values[high]

        pivot = values[middle]
        values[middle], values[high] = values[high], values[middle]

        i = low
        j = high - 1
        while i <= j:
            while values[i] < pivot:
                i += 1
            while values[j] > pivot:
                j -= 1
            if i <= j:
                values[i], values[j] = values[j], values[i]
                i += 1
                j -= 1

        values[i], values[high] = values[high], values[i]

        # Recurse into the smaller side, loop over the larger side.
        if i - low < high - i:
            _quick_sort_range(values, low, i - 1)
            low = i + 1
        else:
            _quick_sort_range(values, i + 1, high)
            high = i - 1


def _insertion_sort_range(values: list[Any], low: int, high: int) -> None:
    for index in range(low + 1, high + 1):
        key = values[index]
        position = index - 1
        while position >= low and values[position] > key:
            values[position + 1] = values[position]
            position -= 1
        values[position + 1] = key


def selection_sort(values: list[Any]) -> None:
    """In-place selection sort."""
    n = len(values)
    for index in range(n - 1):
        minimum = index
        for candidate in range(index + 1, n):
            if values[candidate] < values[minimum]:
                minimum = candidate
        if minimum != index:
            values[index], values[minimum] = values[minimum], values[index]


def insertion_sort(values: list[Any]) -> None:
    """In-place insertion sort."""
    for index in range(1, len(values)):
        key = values[index]
        position = index - 1
        while position >= 0 and values[position] > key:
            values[position + 1] = values[position]
            position -= 1
        values[position + 1] = key


# ---------------------------------------------------------------------------
# Search algorithms
# ---------------------------------------------------------------------------

def linear_search(values: list[Any], target: Any) -> int:
    """Return the first index of target, or -1 when absent."""
    for index, value in enumerate(values):
        if value == target:
            return index
    return -1


def binary_search(values: list[Any], target: Any) -> int:
    """Return an index of target in a sorted list, or -1 when absent."""
    low = 0
    high = len(values) - 1

    while low <= high:
        middle = (low + high) // 2
        value = values[middle]
        if value == target:
            return middle
        if value < target:
            low = middle + 1
        else:
            high = middle - 1

    return -1


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

SORTING_FUNCTIONS = {
    "heap_sort": heap_sort,
    "bubble_sort": bubble_sort,
    "merge_sort": merge_sort,
    "quick_sort": quick_sort,
    "selection_sort": selection_sort,
    "insertion_sort": insertion_sort,
}

SEARCH_FUNCTIONS = {
    "linear_search": linear_search,
    "binary_search": binary_search,
}

ALGORITHM_ORDER = [
    "heap_sort",
    "bubble_sort",
    "linear_search",
    "binary_search",
    "merge_sort",
    "quick_sort",
    "selection_sort",
    "insertion_sort",
]

ALGORITHMS = {
    "heap_sort": {
        "id": "heap_sort",
        "name": "Heap Sort",
        "short_name": "Heap",
        "category": "sorting",
        "color": "#314B5E",
        "method": "Comparison · In-place",
        "stable": False,
        "sortlab_key": "heap",
        "complexity": {
            "best": "O(n log n)",
            "average": "O(n log n)",
            "worst": "O(n log n)",
            "space": "O(1)",
        },
        "description": "Builds a max-heap and repeatedly extracts the largest value.",
    },
    "bubble_sort": {
        "id": "bubble_sort",
        "name": "Bubble Sort",
        "short_name": "Bubble",
        "category": "sorting",
        "color": "#9C4A3C",
        "method": "Comparison · Exchange",
        "stable": True,
        "sortlab_key": "bubble",
        "complexity": {
            "best": "O(n)",
            "average": "O(n²)",
            "worst": "O(n²)",
            "space": "O(1)",
        },
        "description": "Repeated adjacent swaps; early exit makes sorted input cheap.",
    },
    "linear_search": {
        "id": "linear_search",
        "name": "Linear Search",
        "short_name": "Linear",
        "category": "searching",
        "color": "#6B7A4F",
        "method": "Sequential search",
        "stable": None,
        "sortlab_key": None,
        "complexity": {
            "best": "O(1)",
            "average": "O(n)",
            "worst": "O(n)",
            "space": "O(1)",
        },
        "description": "Scans from the first element until the target is found or absent.",
    },
    "binary_search": {
        "id": "binary_search",
        "name": "Binary Search",
        "short_name": "Binary",
        "category": "searching",
        "color": "#3F6B5A",
        "method": "Divide and conquer search",
        "stable": None,
        "sortlab_key": None,
        "complexity": {
            "best": "O(1)",
            "average": "O(log n)",
            "worst": "O(log n)",
            "space": "O(1)",
        },
        "description": "Halves a sorted search space with each comparison.",
    },
    "merge_sort": {
        "id": "merge_sort",
        "name": "Merge Sort",
        "short_name": "Merge",
        "category": "sorting",
        "color": "#4A6B8A",
        "method": "Comparison · Divide and conquer",
        "stable": True,
        "sortlab_key": "merge",
        "complexity": {
            "best": "O(n log n)",
            "average": "O(n log n)",
            "worst": "O(n log n)",
            "space": "O(n)",
        },
        "description": "Stable divide-and-conquer sort that merges sorted halves.",
    },
    "quick_sort": {
        "id": "quick_sort",
        "name": "Quick Sort",
        "short_name": "Quick",
        "category": "sorting",
        "color": "#7A5A6E",
        "method": "Comparison · Divide and conquer",
        "stable": False,
        "sortlab_key": "quick",
        "complexity": {
            "best": "O(n log n)",
            "average": "O(n log n)",
            "worst": "O(n²)",
            "space": "O(log n)",
        },
        "description": "Partitions around a median-of-three pivot, then recurses.",
    },
    "selection_sort": {
        "id": "selection_sort",
        "name": "Selection Sort",
        "short_name": "Selection",
        "category": "sorting",
        "color": "#A17A3F",
        "method": "Comparison · Selection",
        "stable": False,
        "sortlab_key": "selection",
        "complexity": {
            "best": "O(n²)",
            "average": "O(n²)",
            "worst": "O(n²)",
            "space": "O(1)",
        },
        "description": "Selects the smallest remaining value and places it in front.",
    },
    "insertion_sort": {
        "id": "insertion_sort",
        "name": "Insertion Sort",
        "short_name": "Insertion",
        "category": "sorting",
        "color": "#8A6A4A",
        "method": "Comparison · Insertion",
        "stable": True,
        "sortlab_key": "insertion",
        "complexity": {
            "best": "O(n)",
            "average": "O(n²)",
            "worst": "O(n²)",
            "space": "O(1)",
        },
        "description": "Builds a sorted prefix by inserting each value into place.",
    },
}

SORTING_ALGORITHMS = [
    algorithm_id
    for algorithm_id in ALGORITHM_ORDER
    if ALGORITHMS[algorithm_id]["category"] == "sorting"
]

SEARCHING_ALGORITHMS = [
    algorithm_id
    for algorithm_id in ALGORITHM_ORDER
    if ALGORITHMS[algorithm_id]["category"] == "searching"
]

QUADRATIC_ALGORITHMS = {"bubble_sort", "selection_sort", "insertion_sort"}
