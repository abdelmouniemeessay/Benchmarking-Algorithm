/* ==========================================================================
   SortLab algorithm engine
   Extracted from SortLab - Interactive Sorting Algorithm Visualizer
   (zero-dependency step generators, English documentation retained).
   Each generator returns an ordered trace of compare / swap / overwrite /
   pivot / sorted events. The visualizer consumes the trace separately.
   ========================================================================== */
window.SortLabAlgorithms = {
  "bubble": {
    name: "Bubble Sort",
    file: "bubbleSort.js",
    code: [
      "function bubbleSort(arr) {",
      "  let n = arr.length;",
      "  for (let i = 0; i < n - 1; i++) {",
      "    for (let j = 0; j < n - i - 1; j++) {",
      "      if (arr[j] > arr[j + 1]) {",
      "        swap(arr[j], arr[j + 1]);",
      "      }",
      "    }",
      "  }",
      "  return arr;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice();
      const n = a.length;
      const steps = [];
      for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
          steps.push({ line: 4, type: "compare", indices: [j, j + 1] });
          if (a[j] > a[j + 1]) {
            steps.push({ line: 5, type: "swap", indices: [j, j + 1] });
            [a[j], a[j + 1]] = [a[j + 1], a[j]];
          }
        }
        steps.push({ line: 2, type: "sorted", index: n - 1 - i });
      }
      steps.push({ line: 9, type: "sorted", index: 0 });
      return steps;
    },
    docs: {
      "intuition": "Bubble Sort repeatedly scans the array, comparing each pair of neighbouring elements and swapping them when they're out of order. On every full pass, the largest remaining value 'bubbles up' to its final position at the end of the array, so each subsequent pass only needs to check one fewer element.",
      "best": "O(n)",
      "bestWhy": "If the array is already sorted, a single pass with an early-exit flag finds zero swaps and stops immediately — n − 1 comparisons, no swaps.",
      "avg": "O(n²)",
      "avgWhy": "The outer loop runs n − 1 times and the inner loop shrinks each time; on average about half the possible pairs need swapping, giving roughly n(n − 1)/2 operations, which is O(n²).",
      "worst": "O(n²)",
      "worstWhy": "For a reverse-sorted array, every adjacent pair is out of order, so all n(n − 1)/2 comparisons also trigger a swap — quadratic time.",
      "space": "O(1)",
      "spaceWhy": "Sorting happens in place using only the loop counters i and j; no auxiliary array is allocated."
    }
  },
  "selection": {
    name: "Selection Sort",
    file: "selectionSort.js",
    code: [
      "function selectionSort(arr) {",
      "  let n = arr.length;",
      "  for (let i = 0; i < n - 1; i++) {",
      "    let minIdx = i;",
      "    for (let j = i + 1; j < n; j++) {",
      "      if (arr[j] < arr[minIdx]) {",
      "        minIdx = j;",
      "      }",
      "    }",
      "    if (minIdx !== i) {",
      "      swap(arr[i], arr[minIdx]);",
      "    }",
      "  }",
      "  return arr;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice();
      const n = a.length;
      const steps = [];
      for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        steps.push({ line: 3, type: "select", index: i });
        for (let j = i + 1; j < n; j++) {
          steps.push({ line: 5, type: "compare", indices: [j, minIdx] });
          if (a[j] < a[minIdx]) {
            minIdx = j;
            steps.push({ line: 6, type: "select", index: minIdx });
          }
        }
        if (minIdx !== i) {
          steps.push({ line: 10, type: "swap", indices: [i, minIdx] });
          [a[i], a[minIdx]] = [a[minIdx], a[i]];
        }
        steps.push({ line: 2, type: "sorted", index: i });
      }
      steps.push({ line: 2, type: "sorted", index: n - 1 });
      return steps;
    },
    docs: {
      "intuition": "Selection Sort divides the array into a sorted prefix and an unsorted suffix. On every iteration it scans the unsorted part to find the smallest remaining value, then swaps it into the next open slot at the front — growing the sorted prefix by one element each time.",
      "best": "O(n²)",
      "bestWhy": "Even on an already-sorted array, the algorithm still scans the entire unsorted suffix on every iteration to confirm the minimum — comparisons never depend on the input order.",
      "avg": "O(n²)",
      "avgWhy": "The number of comparisons is fixed regardless of data: (n − 1) + (n − 2) + … + 1 = n(n − 1)/2, which is always O(n²).",
      "worst": "O(n²)",
      "worstWhy": "Same as the average case — comparison count is data-independent, so the worst case matches: n(n − 1)/2 comparisons.",
      "space": "O(1)",
      "spaceWhy": "Only a few scalar variables (i, j, minIdx) are used; swapping happens directly inside the original array."
    }
  },
  "insertion": {
    name: "Insertion Sort",
    file: "insertionSort.js",
    code: [
      "function insertionSort(arr) {",
      "  let n = arr.length;",
      "  for (let i = 1; i < n; i++) {",
      "    let key = arr[i];",
      "    let j = i - 1;",
      "    while (j >= 0 && arr[j] > key) {",
      "      arr[j + 1] = arr[j];",
      "      j = j - 1;",
      "    }",
      "    arr[j + 1] = key;",
      "  }",
      "  return arr;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice();
      const n = a.length;
      const steps = [];
      steps.push({ line: 1, type: "sorted", index: 0 });
      for (let i = 1; i < n; i++) {
        const key = a[i];
        steps.push({ line: 3, type: "select", index: i });
        let j = i - 1;
        while (j >= 0) {
          steps.push({ line: 5, type: "compare", indices: [j, i] });
          if (a[j] > key) {
            steps.push({ line: 6, type: "overwrite", index: j + 1, value: a[j] });
            a[j + 1] = a[j];
            j--;
          } else break;
        }
        steps.push({ line: 9, type: "overwrite", index: j + 1, value: key });
        a[j + 1] = key;
        steps.push({ line: 2, type: "sorted", index: i });
      }
      return steps;
    },
    docs: {
      "intuition": "Insertion Sort builds the sorted array one element at a time, the way a card player sorts a hand: it takes the next element (the 'key'), then shifts every larger element in the sorted prefix one step to the right until it finds the key's correct resting place.",
      "best": "O(n)",
      "bestWhy": "On an already-sorted array, the inner while-loop condition (arr[j] > key) is false immediately for every i, so each element only costs one comparison — n − 1 comparisons total, no shifting.",
      "avg": "O(n²)",
      "avgWhy": "On average, a new element needs to shift past about half of the already-sorted prefix, giving roughly n²/4 shifts across all iterations, which is O(n²).",
      "worst": "O(n²)",
      "worstWhy": "For a reverse-sorted array, every new element must shift past all previously sorted elements, giving 1 + 2 + … + (n − 1) = n(n − 1)/2 shifts.",
      "space": "O(1)",
      "spaceWhy": "Sorting is done in place; only the scalar variables key, i and j are used, regardless of array size."
    }
  },
  "merge": {
    name: "Merge Sort",
    file: "mergeSort.js",
    code: [
      "function mergeSort(arr, l, r) {",
      "  if (l >= r) return;",
      "  let m = Math.floor((l + r) / 2);",
      "  mergeSort(arr, l, m);",
      "  mergeSort(arr, m + 1, r);",
      "  merge(arr, l, m, r);",
      "}",
      "",
      "function merge(arr, l, m, r) {",
      "  let left = arr.slice(l, m + 1);",
      "  let right = arr.slice(m + 1, r + 1);",
      "  let i = 0, j = 0, k = l;",
      "  while (i < left.length && j < right.length) {",
      "    if (left[i] <= right[j]) {",
      "      arr[k++] = left[i++];",
      "    } else {",
      "      arr[k++] = right[j++];",
      "    }",
      "  }",
      "  while (i < left.length) arr[k++] = left[i++];",
      "  while (j < right.length) arr[k++] = right[j++];",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice();
      const n = a.length;
      const steps = [];

      function merge(l, m, r) {
        const left = a.slice(l, m + 1);
        const right = a.slice(m + 1, r + 1);
        let i = 0, j = 0, k = l;
        while (i < left.length && j < right.length) {
          steps.push({ line: 13, type: "compare", indices: [l + i, m + 1 + j] });
          if (left[i] <= right[j]) {
            steps.push({ line: 14, type: "overwrite", index: k, value: left[i] });
            a[k] = left[i]; i++; k++;
          } else {
            steps.push({ line: 16, type: "overwrite", index: k, value: right[j] });
            a[k] = right[j]; j++; k++;
          }
        }
        while (i < left.length) {
          steps.push({ line: 19, type: "overwrite", index: k, value: left[i] });
          a[k] = left[i]; i++; k++;
        }
        while (j < right.length) {
          steps.push({ line: 20, type: "overwrite", index: k, value: right[j] });
          a[k] = right[j]; j++; k++;
        }
      }

      function mergeSortRec(l, r) {
        if (l >= r) return;
        const m = Math.floor((l + r) / 2);
        mergeSortRec(l, m);
        mergeSortRec(m + 1, r);
        merge(l, m, r);
      }

      mergeSortRec(0, n - 1);
      for (let idx = 0; idx < n; idx++) {
        steps.push({ line: 0, type: "sorted", index: idx });
      }
      return steps;
    },
    docs: {
      "intuition": "Merge Sort is a divide-and-conquer algorithm: it splits the array into two halves, recursively sorts each half, and then merges the two already-sorted halves back together by repeatedly taking the smaller of the two front elements into a new sequence.",
      "best": "O(n log n)",
      "bestWhy": "The split step always halves the array (log₂n levels of recursion) and the merge step always does a linear O(n) scan at every level regardless of input order — the recursion tree has log n levels, each costing O(n).",
      "avg": "O(n log n)",
      "avgWhy": "Every recursive call splits the problem in half — T(n) = 2T(n/2) + O(n) — which by the Master Theorem resolves to O(n log n), independent of the initial arrangement of values.",
      "worst": "O(n log n)",
      "worstWhy": "Because the split point never depends on element values (only on array position), the recursion depth and per-level merge cost stay the same even for adversarial input — no case degrades below or above n log n.",
      "space": "O(n)",
      "spaceWhy": "The merge step allocates temporary left/right arrays to hold a copy of the elements being merged; across the whole recursion this needs O(n) auxiliary space (plus O(log n) call-stack depth)."
    }
  },
  "quick": {
    name: "Quick Sort",
    file: "quickSort.js",
    code: [
      "function quickSort(arr, low, high) {",
      "  if (low < high) {",
      "    let pi = partition(arr, low, high);",
      "    quickSort(arr, low, pi - 1);",
      "    quickSort(arr, pi + 1, high);",
      "  }",
      "}",
      "",
      "function partition(arr, low, high) {",
      "  let pivot = arr[high];",
      "  let i = low - 1;",
      "  for (let j = low; j < high; j++) {",
      "    if (arr[j] < pivot) {",
      "      i++;",
      "      swap(arr[i], arr[j]);",
      "    }",
      "  }",
      "  swap(arr[i + 1], arr[high]);",
      "  return i + 1;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice();
      const n = a.length;
      const steps = [];

      function qs(low, high) {
        if (low < high) {
          steps.push({ line: 9, type: "pivot", index: high });
          const pivotVal = a[high];
          let i = low - 1;
          for (let j = low; j < high; j++) {
            steps.push({ line: 12, type: "compare", indices: [j, high] });
            if (a[j] < pivotVal) {
              i++;
              if (i !== j) {
                steps.push({ line: 14, type: "swap", indices: [i, j] });
                [a[i], a[j]] = [a[j], a[i]];
              }
            }
          }
          steps.push({ line: 17, type: "swap", indices: [i + 1, high] });
          [a[i + 1], a[high]] = [a[high], a[i + 1]];
          const pi = i + 1;
          steps.push({ line: 17, type: "sorted", index: pi });
          qs(low, pi - 1);
          qs(pi + 1, high);
        } else if (low === high && low >= 0 && low < n) {
          steps.push({ line: 1, type: "sorted", index: low });
        }
      }

      qs(0, n - 1);
      return steps;
    },
    docs: {
      "intuition": "Quick Sort picks a 'pivot' element (here, the last element of the range) and partitions the array so everything smaller than the pivot ends up to its left and everything larger ends up to its right. The pivot is now in its final sorted position, and the algorithm recursively repeats on the two sub-ranges on either side.",
      "best": "O(n log n)",
      "bestWhy": "If every pivot splits its range into two roughly equal halves, the recursion depth is log₂n, and each of the n elements is examined once per level during partitioning — giving n log n work.",
      "avg": "O(n log n)",
      "avgWhy": "For random pivots, partitions are unbalanced but not extremely skewed on average; the expected recursion depth stays O(log n), so total comparisons average out to O(n log n).",
      "worst": "O(n²)",
      "worstWhy": "If the array is already sorted (or reverse-sorted) and the pivot is always the last element, every partition splits off just one element, producing n levels of recursion each doing O(n) work — n + (n − 1) + … + 1 = O(n²).",
      "space": "O(log n)",
      "spaceWhy": "Quick Sort sorts in place (no auxiliary array), but the recursive calls consume call-stack space proportional to the recursion depth — O(log n) on average, O(n) in the worst-case skewed scenario."
    }
  },
  "heap": {
    name: "Heap Sort",
    file: "heapSort.js",
    code: [
      "function heapSort(arr) {",
      "  let n = arr.length;",
      "  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {",
      "    heapify(arr, n, i);",
      "  }",
      "  for (let i = n - 1; i > 0; i--) {",
      "    swap(arr[0], arr[i]);",
      "    heapify(arr, i, 0);",
      "  }",
      "}",
      "",
      "function heapify(arr, n, i) {",
      "  let largest = i;",
      "  let l = 2 * i + 1;",
      "  let r = 2 * i + 2;",
      "  if (l < n && arr[l] > arr[largest]) largest = l;",
      "  if (r < n && arr[r] > arr[largest]) largest = r;",
      "  if (largest !== i) {",
      "    swap(arr[i], arr[largest]);",
      "    heapify(arr, n, largest);",
      "  }",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice();
      const n = a.length;
      const steps = [];

      function heapify(size, i) {
        let largest = i;
        const l = 2 * i + 1, r = 2 * i + 2;
        if (l < size) {
          steps.push({ line: 15, type: "compare", indices: [l, largest] });
          if (a[l] > a[largest]) largest = l;
        }
        if (r < size) {
          steps.push({ line: 16, type: "compare", indices: [r, largest] });
          if (a[r] > a[largest]) largest = r;
        }
        if (largest !== i) {
          steps.push({ line: 18, type: "swap", indices: [i, largest] });
          [a[i], a[largest]] = [a[largest], a[i]];
          heapify(size, largest);
        }
      }

      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
      for (let i = n - 1; i > 0; i--) {
        steps.push({ line: 6, type: "swap", indices: [0, i] });
        [a[0], a[i]] = [a[i], a[0]];
        steps.push({ line: 6, type: "sorted", index: i });
        heapify(i, 0);
      }
      steps.push({ line: 8, type: "sorted", index: 0 });
      return steps;
    },
    docs: {
      "intuition": "Heap Sort first rearranges the array into a max-heap (a binary tree where every parent is larger than its children), so the largest element sits at the root. It then repeatedly swaps the root with the last unsorted element and 'heapifies' the reduced heap, shrinking the unsorted region by one each time.",
      "best": "O(n log n)",
      "bestWhy": "Building the heap takes O(n), and each of the n extraction steps requires a heapify that walks down a tree of height log n — even sorted input still needs full heapify comparisons since heap structure is position-based, not value-based.",
      "avg": "O(n log n)",
      "avgWhy": "Heap construction is O(n) and each of the n subsequent 'swap root, then sift down' operations costs O(log n), giving a total of O(n) + O(n log n) = O(n log n).",
      "worst": "O(n log n)",
      "worstWhy": "Because sift-down always walks a tree of height ⌊log₂n⌋ regardless of value distribution, no input arrangement can push Heap Sort past O(n log n) — it has no quadratic worst case, unlike Quick Sort.",
      "space": "O(1)",
      "spaceWhy": "The heap is built directly inside the original array (no auxiliary array); only a handful of scalar variables (largest, l, r) are used, so extra space is constant."
    }
  },
  "shell": {
    name: "Shell Sort",
    file: "shellSort.js",
    code: [
      "function shellSort(arr) {",
      "  let n = arr.length;",
      "  let gap = Math.floor(n / 2);",
      "  while (gap > 0) {",
      "    for (let i = gap; i < n; i++) {",
      "      let temp = arr[i], j = i;",
      "      while (j >= gap && arr[j - gap] > temp) {",
      "        arr[j] = arr[j - gap];",
      "        j -= gap;",
      "      }",
      "      arr[j] = temp;",
      "    }",
      "    gap = Math.floor(gap / 2);",
      "  }",
      "  return arr;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice();
      const n = a.length;
      const steps = [];
      let gap = Math.floor(n / 2);
      while (gap > 0) {
        for (let i = gap; i < n; i++) {
          steps.push({ line: 5, type: "select", index: i });
          let temp = a[i]; let j = i;
          while (j >= gap) {
            steps.push({ line: 6, type: "compare", indices: [j - gap, i] });
            if (a[j - gap] > temp) {
              steps.push({ line: 7, type: "overwrite", index: j, value: a[j - gap] });
              a[j] = a[j - gap]; j -= gap;
            } else break;
          }
          steps.push({ line: 10, type: "overwrite", index: j, value: temp });
          a[j] = temp;
        }
        gap = Math.floor(gap / 2);
      }
      return steps;
    },
    docs: {
      "intuition": "Shell Sort is a generalisation of Insertion Sort: instead of always comparing neighbours, it first compares elements that are far apart (separated by a 'gap'), gradually shrinking the gap down to 1. Early passes with a large gap move badly-placed elements a long way in one step, so by the time the gap becomes 1, the array is already nearly sorted and the final pass is cheap.",
      "best": "O(n log n)",
      "bestWhy": "On an already-sorted array, every gapped comparison already satisfies the order condition, so each pass only needs one comparison per element and no shifting.",
      "avg": "O(n^1.3) approx.",
      "avgWhy": "The exact average-case complexity depends on the chosen gap sequence; for the common gap/2 sequence used here it's roughly O(n^1.3), better than Insertion Sort's O(n²) because large gaps eliminate many inversions early.",
      "worst": "O(n²)",
      "worstWhy": "With the simple gap/2 sequence, adversarial inputs can still force close to n²/2 element movements in the worst case, though smarter gap sequences (Hibbard, Sedgewick) push this down to O(n^1.5) or better.",
      "space": "O(1)",
      "spaceWhy": "Shell Sort rearranges elements in place using only the loop variables gap, i, j and temp — no auxiliary array is needed."
    }
  },
  "cocktail": {
    name: "Cocktail Shaker Sort",
    file: "cocktailShakerSort.js",
    code: [
      "function cocktailSort(arr) {",
      "  let start = 0, end = arr.length - 1;",
      "  let swapped = true;",
      "  while (swapped) {",
      "    swapped = false;",
      "    for (let i = start; i < end; i++) {",
      "      if (arr[i] > arr[i + 1]) {",
      "        swap(arr[i], arr[i + 1]);",
      "        swapped = true;",
      "      }",
      "    }",
      "    end--;",
      "    if (!swapped) break;",
      "    swapped = false;",
      "    for (let i = end; i > start; i--) {",
      "      if (arr[i - 1] > arr[i]) {",
      "        swap(arr[i - 1], arr[i]);",
      "        swapped = true;",
      "      }",
      "    }",
      "    start++;",
      "  }",
      "  return arr;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice();
      const n = a.length;
      const steps = [];
      let start = 0, end = n - 1, swapped = true;
      while (swapped) {
        swapped = false;
        for (let i = start; i < end; i++) {
          steps.push({ line: 6, type: "compare", indices: [i, i + 1] });
          if (a[i] > a[i + 1]) {
            steps.push({ line: 7, type: "swap", indices: [i, i + 1] });
            [a[i], a[i + 1]] = [a[i + 1], a[i]];
            swapped = true;
          }
        }
        steps.push({ line: 11, type: "sorted", index: end });
        end--;
        if (!swapped) break;
        swapped = false;
        for (let i = end; i > start; i--) {
          steps.push({ line: 15, type: "compare", indices: [i - 1, i] });
          if (a[i - 1] > a[i]) {
            steps.push({ line: 16, type: "swap", indices: [i - 1, i] });
            [a[i - 1], a[i]] = [a[i], a[i - 1]];
            swapped = true;
          }
        }
        steps.push({ line: 20, type: "sorted", index: start });
        start++;
      }
      return steps;
    },
    docs: {
      "intuition": "Cocktail Shaker Sort is a two-directional Bubble Sort: it bubbles the largest value to the right on a forward pass, then immediately bubbles the smallest value to the left on a backward pass, shrinking the unsorted window from both ends each round instead of only one.",
      "best": "O(n)",
      "bestWhy": "On an already-sorted array, a single forward pass finds no swaps and the algorithm exits immediately via the swapped flag — n − 1 comparisons only.",
      "avg": "O(n²)",
      "avgWhy": "Like Bubble Sort, on average roughly half the adjacent pairs are out of order across the shrinking window in each direction, giving quadratic total comparisons.",
      "worst": "O(n²)",
      "worstWhy": "For specific patterns (e.g. a small value stuck near the end), Cocktail Shaker Sort can actually beat plain Bubble Sort in practice, but its worst-case bound remains O(n²) — a reverse-sorted array still needs close to n(n − 1)/2 comparisons.",
      "space": "O(1)",
      "spaceWhy": "Only the pointers start, end and a swapped flag are used; sorting happens directly inside the original array."
    }
  },
  "comb": {
    name: "Comb Sort",
    file: "combSort.js",
    code: [
      "function combSort(arr) {",
      "  let n = arr.length;",
      "  let gap = n;",
      "  let swapped = true;",
      "  while (gap > 1 || swapped) {",
      "    gap = Math.floor(gap / 1.3) || 1;",
      "    swapped = false;",
      "    for (let i = 0; i + gap < n; i++) {",
      "      if (arr[i] > arr[i + gap]) {",
      "        swap(arr[i], arr[i + gap]);",
      "        swapped = true;",
      "      }",
      "    }",
      "  }",
      "  return arr;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice();
      const n = a.length;
      const steps = [];
      let gap = n; let swapped = true; const shrink = 1.3;
      while (gap > 1 || swapped) {
        gap = Math.floor(gap / shrink); if (gap < 1) gap = 1;
        swapped = false;
        for (let i = 0; i + gap < n; i++) {
          steps.push({ line: 8, type: "compare", indices: [i, i + gap] });
          if (a[i] > a[i + gap]) {
            steps.push({ line: 9, type: "swap", indices: [i, i + gap] });
            [a[i], a[i + gap]] = [a[i + gap], a[i]];
            swapped = true;
          }
        }
      }
      return steps;
    },
    docs: {
      "intuition": "Comb Sort improves on Bubble Sort by comparing elements that are a shrinking 'gap' apart instead of always-adjacent neighbours. This lets it clear out small values stuck near the end of the array (the 'turtles' that cripple plain Bubble Sort) early, quickly, before finishing with gap = 1, which is just Bubble Sort on an already-nearly-sorted array.",
      "best": "O(n log n)",
      "bestWhy": "On an already-sorted array, no gap value ever finds a swap, so each of the O(log n) shrink stages costs only O(n) comparisons with no swaps.",
      "avg": "O(n² / 2^p) roughly",
      "avgWhy": "Empirically Comb Sort's average performance is close to O(n log n) for the standard shrink factor 1.3, though a rigorous general bound is harder to pin down; it consistently beats Bubble Sort in practice by resolving long-distance inversions early.",
      "worst": "O(n²)",
      "worstWhy": "Certain adversarial patterns and an unlucky shrink factor can still degrade Comb Sort to quadratic behaviour, similar to Bubble Sort's worst case, though this is rare with shrink factor 1.3.",
      "space": "O(1)",
      "spaceWhy": "Only the gap variable and loop counters are used; all comparisons and swaps happen directly inside the original array."
    }
  },
  "gnome": {
    name: "Gnome Sort",
    file: "gnomeSort.js",
    code: [
      "function gnomeSort(arr) {",
      "  let i = 0;",
      "  while (i < arr.length) {",
      "    if (i === 0 || arr[i - 1] <= arr[i]) {",
      "      i++;",
      "    } else {",
      "      swap(arr[i], arr[i - 1]);",
      "      i--;",
      "    }",
      "  }",
      "  return arr;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice();
      const n = a.length;
      const steps = [];
      let i = 0;
      while (i < n) {
        if (i === 0) { i++; continue; }
        steps.push({ line: 3, type: "compare", indices: [i - 1, i] });
        if (a[i - 1] <= a[i]) i++;
        else {
          steps.push({ line: 6, type: "swap", indices: [i - 1, i] });
          [a[i], a[i - 1]] = [a[i - 1], a[i]];
          i--;
        }
      }
      return steps;
    },
    docs: {
      "intuition": "Gnome Sort works like a garden gnome sorting flower pots: it looks at the current pot and the one before it — if they're in order, it steps forward; if not, it swaps them and steps back to re-check. There's no nested loop, just a single position pointer that moves forward on success and backward on a swap, similar in spirit to Insertion Sort but implemented with backtracking instead of a shifting loop.",
      "best": "O(n)",
      "bestWhy": "On an already-sorted array, the pointer i only ever moves forward (every adjacent comparison already satisfies order), giving exactly n − 1 comparisons and zero swaps.",
      "avg": "O(n²)",
      "avgWhy": "On random data, the pointer regularly steps backward to fix local disorder, and the total number of forward+backward moves works out to the same order as Insertion Sort's shifts — O(n²) on average.",
      "worst": "O(n²)",
      "worstWhy": "For a reverse-sorted array, every new element must step all the way back through the sorted prefix one swap at a time, giving the same 1 + 2 + … + (n − 1) = O(n²) bound as Insertion Sort.",
      "space": "O(1)",
      "spaceWhy": "Only the single pointer i is used; the array is rearranged in place with simple adjacent swaps."
    }
  },
  "cycle": {
    name: "Cycle Sort",
    file: "cycleSort.js",
    code: [
      "function cycleSort(arr) {",
      "  let n = arr.length;",
      "  for (let s = 0; s < n - 1; s++) {",
      "    let item = arr[s];",
      "    let pos = s;",
      "    for (let i = s + 1; i < n; i++) {",
      "      if (arr[i] < item) pos++;",
      "    }",
      "    if (pos === s) continue;",
      "    while (item === arr[pos]) pos++;",
      "    [arr[pos], item] = [item, arr[pos]];",
      "    while (pos !== s) {",
      "      pos = s;",
      "      for (let i = s + 1; i < n; i++) {",
      "        if (arr[i] < item) pos++;",
      "      }",
      "      while (item === arr[pos]) pos++;",
      "      [arr[pos], item] = [item, arr[pos]];",
      "    }",
      "  }",
      "  return arr;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice();
      const n = a.length;
      const steps = [];
      for (let cycleStart = 0; cycleStart < n - 1; cycleStart++) {
        let item = a[cycleStart];
        let pos = cycleStart;
        for (let i = cycleStart + 1; i < n; i++) {
          steps.push({ line: 6, type: "compare", indices: [i, cycleStart] });
          if (a[i] < item) pos++;
        }
        if (pos === cycleStart) continue;
        while (item === a[pos]) pos++;
        if (pos !== cycleStart) {
          const tmp = a[pos]; a[pos] = item; item = tmp;
          steps.push({ line: 10, type: "overwrite", index: pos, value: a[pos] });
        }
        while (pos !== cycleStart) {
          pos = cycleStart;
          for (let i = cycleStart + 1; i < n; i++) {
            steps.push({ line: 14, type: "compare", indices: [i, cycleStart] });
            if (a[i] < item) pos++;
          }
          while (item === a[pos]) pos++;
          if (item !== a[pos]) {
            const tmp = a[pos]; a[pos] = item; item = tmp;
            steps.push({ line: 17, type: "overwrite", index: pos, value: a[pos] });
          }
        }
      }
      return steps;
    },
    docs: {
      "intuition": "Cycle Sort is built around a single guarantee: every element should be written to its final position exactly once. For each starting position it counts how many elements are smaller than the current one to figure out exactly where it belongs, places it there (evicting whatever was there), and keeps following that 'cycle' of displaced elements until it returns to the start — minimising the total number of memory writes.",
      "best": "O(n²)",
      "bestWhy": "Even on an already-sorted array, Cycle Sort still counts smaller elements for every position to confirm nothing needs to move — the comparison count never depends on the initial order.",
      "avg": "O(n²)",
      "avgWhy": "For each of the n starting positions, finding the correct destination requires scanning the remaining elements, giving the same n(n − 1)/2 comparisons regardless of data arrangement.",
      "worst": "O(n²)",
      "worstWhy": "Comparison count is always n(n − 1)/2 no matter the input — Cycle Sort's advantage isn't speed, it's that the number of array writes is provably minimal (at most n), which matters when writes are expensive (e.g. flash memory).",
      "space": "O(1)",
      "spaceWhy": "Only the scalar variables item and pos are used; every element is written directly to its final resting place with no auxiliary array."
    }
  },
  "pancake": {
    name: "Pancake Sort",
    file: "pancakeSort.js",
    code: [
      "function pancakeSort(arr) {",
      "  for (let size = arr.length; size > 1; size--) {",
      "    let maxIdx = indexOfMax(arr, size);",
      "    if (maxIdx === size - 1) continue;",
      "    if (maxIdx !== 0) flip(arr, maxIdx);",
      "    flip(arr, size - 1);",
      "  }",
      "  return arr;",
      "}",
      "",
      "function flip(arr, k) {",
      "  let l = 0;",
      "  while (l < k) {",
      "    swap(arr[l], arr[k]);",
      "    l++; k--;",
      "  }",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice();
      const n = a.length;
      const steps = [];
      function flip(k) {
        let l = 0;
        while (l < k) {
          steps.push({ line: 13, type: "swap", indices: [l, k] });
          [a[l], a[k]] = [a[k], a[l]]; l++; k--;
        }
      }
      for (let size = n; size > 1; size--) {
        let maxIdx = 0;
        for (let i = 1; i < size; i++) {
          steps.push({ line: 3, type: "compare", indices: [i, maxIdx] });
          if (a[i] > a[maxIdx]) maxIdx = i;
        }
        if (maxIdx === size - 1) { steps.push({ line: 4, type: "sorted", index: size - 1 }); continue; }
        if (maxIdx !== 0) { steps.push({ line: 5, type: "pivot", index: maxIdx }); flip(maxIdx); }
        flip(size - 1);
        steps.push({ line: 6, type: "sorted", index: size - 1 });
      }
      return steps;
    },
    docs: {
      "intuition": "Pancake Sort can only do one thing: flip a prefix of the array (like flipping a stack of pancakes with a spatula). On each round it finds the largest unsorted pancake, flips the stack up to that pancake to bring it to the top, then flips the whole unsorted stack to send it to the bottom — its correct final position — and repeats on one smaller stack.",
      "best": "O(n)",
      "bestWhy": "Even on sorted input, finding the maximum of each shrinking prefix still costs a full scan (size − 1 comparisons), though no flips are needed since every max is already at the end — n(n−1)/2 comparisons dominate, but with zero swaps the constant factor is small; some formulations still call this Θ(n²) — see worst case.",
      "avg": "O(n²)",
      "avgWhy": "Each of the n rounds needs O(size) comparisons to find the max plus up to 2 flips of O(size) swaps, giving roughly n²/2 comparisons and O(n²) total flip operations.",
      "worst": "O(n²)",
      "worstWhy": "For a reverse-sorted array, nearly every round needs two full flips, and the flip cost itself is O(size) per round — summing over all n rounds gives O(n²) swaps, the same order as the comparisons.",
      "space": "O(1)",
      "spaceWhy": "Flips are performed directly inside the array by swapping mirrored positions; only the loop indices l, k and maxIdx are used."
    }
  },
  "oddeven": {
    name: "Odd-Even Sort",
    file: "oddEvenSort.js",
    code: [
      "function oddEvenSort(arr) {",
      "  let n = arr.length, sorted = false;",
      "  while (!sorted) {",
      "    sorted = true;",
      "    for (let i = 1; i < n - 1; i += 2) {",
      "      if (arr[i] > arr[i + 1]) {",
      "        swap(arr[i], arr[i + 1]); sorted = false;",
      "      }",
      "    }",
      "    for (let i = 0; i < n - 1; i += 2) {",
      "      if (arr[i] > arr[i + 1]) {",
      "        swap(arr[i], arr[i + 1]); sorted = false;",
      "      }",
      "    }",
      "  }",
      "  return arr;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice();
      const n = a.length;
      const steps = [];
      let sorted = false;
      while (!sorted) {
        sorted = true;
        for (let i = 1; i < n - 1; i += 2) {
          steps.push({ line: 5, type: "compare", indices: [i, i + 1] });
          if (a[i] > a[i + 1]) { steps.push({ line: 6, type: "swap", indices: [i, i + 1] }); [a[i], a[i + 1]] = [a[i + 1], a[i]]; sorted = false; }
        }
        for (let i = 0; i < n - 1; i += 2) {
          steps.push({ line: 10, type: "compare", indices: [i, i + 1] });
          if (a[i] > a[i + 1]) { steps.push({ line: 11, type: "swap", indices: [i, i + 1] }); [a[i], a[i + 1]] = [a[i + 1], a[i]]; sorted = false; }
        }
      }
      return steps;
    },
    docs: {
      "intuition": "Odd-Even Sort (also called Brick Sort) alternates between two kinds of passes: an 'odd' pass that compares pairs starting at index 1 (1-2, 3-4, …) and an 'even' pass that compares pairs starting at index 0 (0-1, 2-3, …), swapping out-of-order neighbours in both. Because both passes can run independently on disjoint pairs, this algorithm was originally designed for parallel hardware, where every comparison in a pass happens simultaneously.",
      "best": "O(n)",
      "bestWhy": "On an already-sorted array, one full odd+even round finds zero swaps and the sorted flag stops the loop immediately — O(n) comparisons total.",
      "avg": "O(n²)",
      "avgWhy": "Like Bubble Sort, values can only move one position per pass on average, so it takes roughly n rounds of O(n) comparisons each to fully sort random data — O(n²) overall.",
      "worst": "O(n²)",
      "worstWhy": "A reverse-sorted array needs close to n rounds before every element reaches its correct position, giving the same quadratic bound as Bubble Sort in the sequential case.",
      "space": "O(1)",
      "spaceWhy": "Sorting happens in place using only the loop index i and a boolean sorted flag."
    }
  },
  "bitonic": {
    name: "Bitonic Sort",
    file: "bitonicSort.js",
    code: [
      "// Array length is padded up to the next power of two",
      "// with a large sentinel value (needed by the algorithm).",
      "function bitonicSort(arr, lo, cnt, dir) {",
      "  if (cnt > 1) {",
      "    let k = cnt / 2;",
      "    bitonicSort(arr, lo, k, true);       // ascending half",
      "    bitonicSort(arr, lo + k, k, false);  // descending half",
      "    bitonicMerge(arr, lo, cnt, dir);",
      "  }",
      "}",
      "",
      "function bitonicMerge(arr, lo, cnt, dir) {",
      "  if (cnt > 1) {",
      "    let k = cnt / 2;",
      "    for (let i = lo; i < lo + k; i++) {",
      "      if (dir === (arr[i] > arr[i + k])) {",
      "        swap(arr[i], arr[i + k]);",
      "      }",
      "    }",
      "    bitonicMerge(arr, lo, k, dir);",
      "    bitonicMerge(arr, lo + k, k, dir);",
      "  }",
      "}"
    ],
    generate: function generate(originalArr) {
      // Use a sentinel just tall enough to always sort last, but proportional
      // to the real data so padding bars don't crush real bars to invisible
      // slivers on the shared height scale (a fixed huge constant would).
      const realMax = originalArr.length ? Math.max(...originalArr) : 1;
      const SENTINEL = Math.ceil(realMax * 1.25) + 5;
      let n = 1; while (n < originalArr.length) n *= 2;
      const a = originalArr.slice();
      while (a.length < n) a.push(SENTINEL);
      const steps = [];
      function compareSwap(i, j, dir) {
        steps.push({ line: 14, type: "compare", indices: [i, j] });
        const shouldSwap = dir ? a[i] > a[j] : a[i] < a[j];
        if (shouldSwap) {
          steps.push({ line: 15, type: "swap", indices: [i, j] });
          [a[i], a[j]] = [a[j], a[i]];
        }
      }
      function bitonicMerge(lo, cnt, dir) {
        if (cnt > 1) {
          const k = cnt / 2;
          for (let i = lo; i < lo + k; i++) compareSwap(i, i + k, dir);
          bitonicMerge(lo, k, dir); bitonicMerge(lo + k, k, dir);
        }
      }
      function bitonicSortRec(lo, cnt, dir) {
        if (cnt > 1) {
          const k = cnt / 2;
          bitonicSortRec(lo, k, true); bitonicSortRec(lo + k, k, false); bitonicMerge(lo, cnt, dir);
        }
      }
      const displayArray = a.slice();
      bitonicSortRec(0, n, true);
      return { steps, displayArray };
    },
    docs: {
      "intuition": "Bitonic Sort turns the array into a 'bitonic sequence' (one that first rises then falls, or vice versa) and repeatedly splits and merges it using a fixed comparison network — the same sequence of compare-swap operations runs regardless of the input values, which is exactly why it's ideal for parallel hardware and GPUs (every comparison at a given stage is independent and can run simultaneously). Because the network structure requires the array length to be a power of two, this visualizer pads the array with large sentinel values (shown as extra tall bars) up to the next power of two before sorting.",
      "best": "O(n log² n)",
      "bestWhy": "Bitonic Sort is a fixed sorting network — the exact same comparisons run no matter what the input looks like, so best, average and worst case are identical.",
      "avg": "O(n log² n)",
      "avgWhy": "The network has log₂n merge stages, and each stage performs O(n) comparisons across log₂n internal merge levels, giving O(n log²n) total — data-independent by design.",
      "worst": "O(n log² n)",
      "worstWhy": "Since the comparison sequence never depends on element values, there is no adversarial input that can make Bitonic Sort slower — this predictability is its whole point on parallel hardware.",
      "space": "O(n)",
      "spaceWhy": "Padding the array up to the next power of two requires up to n extra sentinel slots in the worst case; the comparisons themselves are in place, but recursive calls also use O(log n) stack depth."
    }
  },
  "bogo": {
    name: "Bogo Sort (educational only)",
    file: "bogoSort.js",
    code: [
      "function bogoSort(arr) {",
      "  while (!isSorted(arr)) {",
      "    shuffle(arr);",
      "  }",
      "  return arr;",
      "}",
      "",
      "function isSorted(arr) {",
      "  for (let i = 1; i < arr.length; i++) {",
      "    if (arr[i - 1] > arr[i]) return false;",
      "  }",
      "  return true;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice();
      const n = a.length;
      const steps = [];
      const CAP = 400; // hard safety cap so the visualizer always terminates
      let guard = 0;
      function currentlySorted() { for (let i = 1; i < n; i++) if (a[i - 1] > a[i]) return false; return true; }
      while (!currentlySorted() && guard < CAP) {
        for (let i = n - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          steps.push({ line: 2, type: "compare", indices: [i, j] });
          if (i !== j) { steps.push({ line: 3, type: "swap", indices: [i, j] }); [a[i], a[j]] = [a[j], a[i]]; }
        }
        guard++;
      }
      if (!currentlySorted()) {
        const sortedVals = a.slice().sort((x, y) => x - y);
        for (let i = 0; i < n; i++) if (a[i] !== sortedVals[i]) { steps.push({ line: 3, type: "overwrite", index: i, value: sortedVals[i] }); a[i] = sortedVals[i]; }
      }
      return steps;
    },
    docs: {
      "intuition": "Bogo Sort (a.k.a. 'permutation sort' or 'stupid sort') is a deliberate anti-algorithm taught purely to illustrate how NOT to sort: it randomly shuffles the entire array and checks if it happens to be sorted, repeating until it gets lucky. It has no strategy whatsoever — every shuffle is completely independent of previous attempts. (This visualizer caps the number of shuffle attempts so your browser doesn't hang — real Bogo Sort has no such safety net!)",
      "best": "O(n)",
      "bestWhy": "In the extremely lucky case where the very first random shuffle happens to already be sorted, only one O(n) check is needed — but the probability of this is 1/n! (astronomically small for any reasonably-sized array).",
      "avg": "O(n × n!)",
      "avgWhy": "There are n! possible arrangements of n distinct elements and only one of them is sorted, so on average you need about n! shuffles before hitting the sorted one, each costing O(n) to check — expected time is O(n × n!).",
      "worst": "Unbounded",
      "worstWhy": "Bogo Sort has no upper bound at all — in theory it could shuffle forever and never land on the sorted order, since each shuffle is an independent random event with no memory of past attempts.",
      "space": "O(1)",
      "spaceWhy": "The Fisher–Yates shuffle used internally rearranges elements in place; no auxiliary array is needed regardless of how many attempts are made."
    }
  },
  "counting": {
    name: "Counting Sort",
    file: "countingSort.js",
    code: [
      "function countingSort(arr) {",
      "  let max = Math.max(...arr);",
      "  let min = Math.min(...arr);",
      "  let count = new Array(max - min + 1).fill(0);",
      "  for (let v of arr) count[v - min]++;",
      "  for (let i = 1; i < count.length; i++) {",
      "    count[i] += count[i - 1];",
      "  }",
      "  let output = new Array(arr.length);",
      "  for (let i = arr.length - 1; i >= 0; i--) {",
      "    output[count[arr[i] - min] - 1] = arr[i];",
      "    count[arr[i] - min]--;",
      "  }",
      "  return output;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice(); const n = a.length; const steps = [];
      if (n === 0) return steps;
      const max = Math.max(...a), min = Math.min(...a);
      const count = new Array(max - min + 1).fill(0);
      for (const v of a) count[v - min]++;
      for (let i = 1; i < count.length; i++) count[i] += count[i - 1];
      const out = new Array(n);
      for (let i = n - 1; i >= 0; i--) { const idx = count[a[i] - min] - 1; out[idx] = a[i]; count[a[i] - min]--; }
      for (let i = 0; i < n; i++) steps.push({ line: 10, type: "overwrite", index: i, value: out[i] });
      return steps;
    },
    docs: {
      "intuition": "Counting Sort doesn't compare elements at all — it counts how many times each distinct value appears, turns those counts into 'how many elements are ≤ this value' via a running sum, and uses that running sum directly as each element's final index. It's extremely fast, but only works for elements from a known, reasonably small range (like small integers), since it needs one counter per possible value.",
      "best": "O(n + k)",
      "bestWhy": "The algorithm always makes exactly one pass to count (O(n)), one pass to accumulate the running sum over the value range (O(k), where k is the range of values), and one pass to place elements (O(n)) — input order never changes this.",
      "avg": "O(n + k)",
      "avgWhy": "Because Counting Sort works on counts rather than comparisons, its cost only depends on the number of elements n and the value range k = max − min + 1, never on how the values are ordered.",
      "worst": "O(n + k)",
      "worstWhy": "There is no adversarial input that increases the work — the only thing that matters is k, the size of the value range; a huge range (e.g. sorting values from 1 to 10 million) makes this impractical even though n stays small.",
      "space": "O(n + k)",
      "spaceWhy": "A count array of size k (the value range) and an output array of size n are both required in addition to the input — this is not an in-place algorithm."
    }
  },
  "radix": {
    name: "Radix Sort",
    file: "radixSort.js",
    code: [
      "function radixSort(arr) {",
      "  let max = Math.max(...arr);",
      "  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {",
      "    arr = countingSortByDigit(arr, exp);",
      "  }",
      "  return arr;",
      "}",
      "",
      "function countingSortByDigit(arr, exp) {",
      "  let output = new Array(arr.length).fill(0);",
      "  let count = new Array(10).fill(0);",
      "  for (let v of arr) count[Math.floor(v / exp) % 10]++;",
      "  for (let i = 1; i < 10; i++) count[i] += count[i - 1];",
      "  for (let i = arr.length - 1; i >= 0; i--) {",
      "    let d = Math.floor(arr[i] / exp) % 10;",
      "    output[count[d] - 1] = arr[i];",
      "    count[d]--;",
      "  }",
      "  return output;",
      "}"
    ],
    generate: function generate(arr) {
      let a = arr.slice(); const n = a.length; const steps = [];
      if (n === 0) return steps;
      const max = Math.max(...a);
      for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
        const output = new Array(n).fill(0);
        const count = new Array(10).fill(0);
        for (let i = 0; i < n; i++) { steps.push({ line: 10, type: "select", index: i }); count[Math.floor(a[i] / exp) % 10]++; }
        for (let i = 1; i < 10; i++) count[i] += count[i - 1];
        for (let i = n - 1; i >= 0; i--) { const d = Math.floor(a[i] / exp) % 10; output[count[d] - 1] = a[i]; count[d]--; }
        a = output;
        for (let i = 0; i < n; i++) steps.push({ line: 15, type: "overwrite", index: i, value: a[i] });
      }
      return steps;
    },
    docs: {
      "intuition": "Radix Sort sorts numbers digit by digit instead of comparing whole values. Starting from the least-significant digit (ones place), it runs a stable Counting Sort keyed on just that digit, then repeats for the tens place, hundreds place, and so on. Because each pass is stable, elements that were already correctly ordered by earlier (more significant) digits stay in that relative order.",
      "best": "O(d × (n + b))",
      "bestWhy": "Every pass costs O(n + b) regardless of input order (b = 10 for base-10 digits), and the number of passes d is fixed by the number of digits in the largest value — there's no 'lucky' input that skips passes.",
      "avg": "O(d × (n + b))",
      "avgWhy": "Same as best case: Radix Sort's cost depends only on the number of elements n, the digit base b, and the number of digits d in the maximum value — never on how the values are arranged.",
      "worst": "O(d × (n + b))",
      "worstWhy": "No arrangement of input values can make Radix Sort do extra work — its performance is entirely determined by d (digit count), which grows only logarithmically with the maximum value.",
      "space": "O(n + b)",
      "spaceWhy": "Each digit pass needs an output array of size n and a count array of size b (the digit base, 10 here) — these are reused across passes but still count as auxiliary space."
    }
  },
  "bucket": {
    name: "Bucket Sort",
    file: "bucketSort.js",
    code: [
      "function bucketSort(arr) {",
      "  let max = Math.max(...arr), min = Math.min(...arr);",
      "  let bucketCount = Math.floor(Math.sqrt(arr.length));",
      "  let range = (max - min + 1) / bucketCount;",
      "  let buckets = Array.from({ length: bucketCount }, () => []);",
      "  for (let v of arr) {",
      "    let idx = Math.floor((v - min) / range);",
      "    buckets[Math.min(idx, bucketCount - 1)].push(v);",
      "  }",
      "  let output = [];",
      "  for (let bucket of buckets) {",
      "    bucket.sort((a, b) => a - b);",
      "    output.push(...bucket);",
      "  }",
      "  return output;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice(); const n = a.length; const steps = [];
      if (n === 0) return steps;
      const max = Math.max(...a), min = Math.min(...a);
      const bucketCount = Math.max(1, Math.floor(Math.sqrt(n)));
      const range = (max - min + 1) / bucketCount;
      const buckets = Array.from({ length: bucketCount }, () => []);
      for (const v of a) { let idx = Math.floor((v - min) / range); if (idx >= bucketCount) idx = bucketCount - 1; buckets[idx].push(v); }
      const out = [];
      for (const b of buckets) { b.sort((x, y) => x - y); out.push(...b); }
      for (let i = 0; i < n; i++) steps.push({ line: 10, type: "overwrite", index: i, value: out[i] });
      return steps;
    },
    docs: {
      "intuition": "Bucket Sort scatters elements into a fixed number of 'buckets' based on their value range (like sorting mail by zip-code range into separate bins), sorts each small bucket individually with a simple algorithm, then concatenates the buckets in order. It works best when values are roughly uniformly distributed across the range, so each bucket ends up with a similar (small) number of elements.",
      "best": "O(n + k)",
      "bestWhy": "If values are perfectly uniformly distributed, every bucket gets about n/(number of buckets) elements, and sorting each tiny bucket is nearly instant — the dominant cost is the single O(n) distribution pass plus O(k) bucket setup.",
      "avg": "O(n + k)",
      "avgWhy": "For reasonably uniform data, the expected size of each bucket stays small and constant, so the per-bucket sort (even a quadratic one) contributes only a small constant amount of extra work per bucket on average.",
      "worst": "O(n²)",
      "worstWhy": "If all values happen to fall into the same bucket (e.g. heavily skewed data), that one bucket ends up holding all n elements, and sorting it degrades to whatever the per-bucket sort's worst case is (here O(n²) with insertion-style bucket sorting).",
      "space": "O(n + k)",
      "spaceWhy": "The bucket structures themselves need O(n) total space to hold every element across all buckets, plus O(k) for the bucket array itself."
    }
  },
  "pigeonhole": {
    name: "Pigeonhole Sort",
    file: "pigeonholeSort.js",
    code: [
      "function pigeonholeSort(arr) {",
      "  let max = Math.max(...arr), min = Math.min(...arr);",
      "  let holes = new Array(max - min + 1).fill(0);",
      "  for (let v of arr) holes[v - min]++;",
      "  let output = [];",
      "  for (let i = 0; i < holes.length; i++) {",
      "    for (let c = 0; c < holes[i]; c++) {",
      "      output.push(i + min);",
      "    }",
      "  }",
      "  return output;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice(); const n = a.length; const steps = [];
      if (n === 0) return steps;
      const max = Math.max(...a), min = Math.min(...a);
      const holes = new Array(max - min + 1).fill(0);
      for (const v of a) holes[v - min]++;
      const out = [];
      for (let i = 0; i < holes.length; i++) for (let c = 0; c < holes[i]; c++) out.push(i + min);
      for (let i = 0; i < n; i++) steps.push({ line: 8, type: "overwrite", index: i, value: out[i] });
      return steps;
    },
    docs: {
      "intuition": "Pigeonhole Sort is Counting Sort's simplest cousin: it creates one 'hole' (bucket) for every possible value in the range, drops each element straight into its own hole, then walks through the holes in order, reading elements back out — no comparisons, no arithmetic beyond addressing. It's essentially a direct-addressing scheme, ideal when the number of distinct values is close to the number of elements.",
      "best": "O(n + range)",
      "bestWhy": "Every element requires exactly one placement into its hole (O(n)) and the holes are always walked through in full regardless of contents (O(range)) — there's no shortcut for sorted input since no comparisons happen at all.",
      "avg": "O(n + range)",
      "avgWhy": "Cost depends purely on n (elements) and range (max − min + 1), never on the arrangement of values — this is a hallmark of all direct-addressing, non-comparison sorts.",
      "worst": "O(n + range)",
      "worstWhy": "No input arrangement can slow this down further; the only danger is a very large range relative to n, which wastes both time and memory walking through mostly-empty holes.",
      "space": "O(n + range)",
      "spaceWhy": "One hole per possible value must be allocated (O(range)), and every element is also duplicated into the output array (O(n)) — this is not an in-place algorithm."
    }
  },
  "flash": {
    name: "Flash Sort",
    file: "flashSort.js",
    code: [
      "function flashSort(arr) {",
      "  let min = Math.min(...arr), max = Math.max(...arr);",
      "  let m = Math.floor(0.45 * arr.length);",
      "  let L = new Array(m).fill(0);",
      "  let c1 = (m - 1) / (max - min);",
      "  for (let v of arr) L[Math.floor(c1 * (v - min))]++;",
      "  for (let k = 1; k < m; k++) L[k] += L[k - 1];",
      "  // classify each element into its bucket, cycling",
      "  // it directly into place (the 'permutation' step)",
      "  permuteIntoBuckets(arr, L, c1, min);",
      "  // finish with a cheap insertion sort (data is now",
      "  // roughly bucketed / nearly sorted)",
      "  insertionSort(arr);",
      "  return arr;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice(); const n = a.length; const steps = [];
      if (n === 0) return steps;
      const min = Math.min(...a), max = Math.max(...a);
      if (min === max) return steps;
      const m = Math.max(1, Math.floor(0.45 * n));
      const L = new Array(m).fill(0);
      const c1 = (m - 1) / (max - min);
      for (let i = 0; i < n; i++) { const k = Math.floor(c1 * (a[i] - min)); L[k]++; }
      for (let k = 1; k < m; k++) L[k] += L[k - 1];
      let move = 0, j = 0, k = m - 1;
      while (move < n - 1) {
        while (j > L[k] - 1) { j++; k = Math.floor(c1 * (a[j] - min)); }
        let flash = a[j];
        while (j !== L[k]) {
          k = Math.floor(c1 * (flash - min));
          const hold = a[L[k] - 1];
          a[L[k] - 1] = flash;
          steps.push({ line: 9, type: "overwrite", index: L[k] - 1, value: flash });
          flash = hold; L[k]--; move++;
        }
      }
      for (let i = 1; i < n; i++) {
        let temp = a[i]; let jj = i - 1;
        while (jj >= 0) {
          steps.push({ line: 12, type: "compare", indices: [jj, i] });
          if (a[jj] > temp) { steps.push({ line: 12, type: "overwrite", index: jj + 1, value: a[jj] }); a[jj + 1] = a[jj]; jj--; }
          else break;
        }
        steps.push({ line: 12, type: "overwrite", index: jj + 1, value: temp });
        a[jj + 1] = temp;
      }
      return steps;
    },
    docs: {
      "intuition": "Flash Sort estimates where each element should roughly end up using a linear formula based on its value (similar to Bucket Sort's idea), cycles elements directly into their approximate class boundaries in a single in-place permutation pass, and then runs a quick Insertion Sort to fix up the now-nearly-sorted array. It's designed for uniformly-distributed numerical data where it can achieve near-linear performance.",
      "best": "O(n)",
      "bestWhy": "For uniformly distributed data, the classification formula places almost every element in (or very near) its correct final class in one permutation pass, leaving the finishing Insertion Sort with almost nothing to do.",
      "avg": "O(n)",
      "avgWhy": "Flash Sort's average-case linear time is its headline feature for roughly-uniform numeric data — the O(m) bucket setup, O(n) permutation pass, and near-O(n) cleanup sort combine to stay linear in practice.",
      "worst": "O(n²)",
      "worstWhy": "If the data is heavily skewed (e.g. many values clustered together, defeating the linear classification formula), most elements land in the same class and the finishing Insertion Sort degrades to its own O(n²) worst case.",
      "space": "O(m)",
      "spaceWhy": "The bucket/class boundary array L needs O(m) space (m ≈ 0.45n by convention); the permutation itself happens in place inside the original array."
    }
  },
  "tree": {
    name: "Tree Sort",
    file: "treeSort.js",
    code: [
      "function treeSort(arr) {",
      "  let root = null;",
      "  for (let v of arr) root = insert(root, v);",
      "  let output = [];",
      "  inorder(root, output);",
      "  return output;",
      "}",
      "",
      "function insert(node, v) {",
      "  if (!node) return { v, l: null, r: null };",
      "  if (v < node.v) node.l = insert(node.l, v);",
      "  else node.r = insert(node.r, v);",
      "  return node;",
      "}",
      "",
      "function inorder(node, out) {",
      "  if (!node) return;",
      "  inorder(node.l, out);",
      "  out.push(node.v);",
      "  inorder(node.r, out);",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice(); const n = a.length; const steps = [];
      class Node { constructor(v) { this.v = v; this.l = null; this.r = null; } }
      let root = null;
      function insert(node, v, idx) {
        if (!node) return new Node(v);
        steps.push({ line: 10, type: "compare", indices: [idx, idx] });
        if (v < node.v) node.l = insert(node.l, v, idx);
        else node.r = insert(node.r, v, idx);
        return node;
      }
      for (let i = 0; i < n; i++) { steps.push({ line: 3, type: "select", index: i }); root = insert(root, a[i], i); }
      const out = [];
      function inorder(node) { if (!node) return; inorder(node.l); out.push(node.v); inorder(node.r); }
      inorder(root);
      for (let i = 0; i < n; i++) steps.push({ line: 18, type: "overwrite", index: i, value: out[i] });
      return steps;
    },
    docs: {
      "intuition": "Tree Sort inserts every element into a Binary Search Tree one at a time (smaller values go left, larger go right at each node), then reads the values back out with an in-order traversal (left subtree, node, right subtree) — which visits BST nodes in ascending order by construction. It's essentially Quick Sort's partitioning idea turned into an explicit persistent data structure instead of array swaps.",
      "best": "O(n log n)",
      "bestWhy": "If insertions happen to build a roughly balanced tree (common with random input), each of the n insertions costs O(log n) to find its place, and the final in-order traversal is O(n).",
      "avg": "O(n log n)",
      "avgWhy": "For random input, the resulting BST is balanced with high probability, keeping each insertion at O(log n) — matching the average case of Quick Sort, since both rely on the same recursive partitioning idea.",
      "worst": "O(n²)",
      "worstWhy": "If the input is already sorted (or reverse-sorted), every new element becomes a new rightmost (or leftmost) leaf, degenerating the tree into a linked list — each insertion then costs O(n), giving O(n²) total, just like Quick Sort's worst case.",
      "space": "O(n)",
      "spaceWhy": "Every element requires its own tree node object (with left/right pointers) in addition to the original array — this is not an in-place algorithm, unlike most other O(n log n) comparison sorts."
    }
  },
  "timsort": {
    name: "Tim Sort (simplified)",
    file: "timSort.js",
    code: [
      "const RUN = 8;",
      "function timSort(arr) {",
      "  let n = arr.length;",
      "  for (let i = 0; i < n; i += RUN) {",
      "    insertionSort(arr, i, Math.min(i + RUN - 1, n - 1));",
      "  }",
      "  let size = RUN;",
      "  while (size < n) {",
      "    for (let l = 0; l < n; l += 2 * size) {",
      "      let m = Math.min(l + size - 1, n - 1);",
      "      let r = Math.min(l + 2 * size - 1, n - 1);",
      "      if (m < r) merge(arr, l, m, r);",
      "    }",
      "    size *= 2;",
      "  }",
      "  return arr;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice(); const n = a.length; const steps = [];
      const RUN = 8;
      function insertionSort(l, r) {
        for (let i = l + 1; i <= r; i++) {
          let temp = a[i]; let j = i - 1;
          while (j >= l) {
            steps.push({ line: 4, type: "compare", indices: [j, i] });
            if (a[j] > temp) { steps.push({ line: 4, type: "overwrite", index: j + 1, value: a[j] }); a[j + 1] = a[j]; j--; }
            else break;
          }
          steps.push({ line: 4, type: "overwrite", index: j + 1, value: temp });
          a[j + 1] = temp;
        }
      }
      function merge(l, m, r) {
        const left = a.slice(l, m + 1), right = a.slice(m + 1, r + 1);
        let i = 0, j = 0, k = l;
        while (i < left.length && j < right.length) {
          steps.push({ line: 11, type: "compare", indices: [l + i, m + 1 + j] });
          if (left[i] <= right[j]) { steps.push({ line: 11, type: "overwrite", index: k, value: left[i] }); a[k++] = left[i++]; }
          else { steps.push({ line: 11, type: "overwrite", index: k, value: right[j] }); a[k++] = right[j++]; }
        }
        while (i < left.length) { steps.push({ line: 11, type: "overwrite", index: k, value: left[i] }); a[k++] = left[i++]; }
        while (j < right.length) { steps.push({ line: 11, type: "overwrite", index: k, value: right[j] }); a[k++] = right[j++]; }
      }
      for (let i = 0; i < n; i += RUN) insertionSort(i, Math.min(i + RUN - 1, n - 1));
      let size = RUN;
      while (size < n) {
        for (let l = 0; l < n; l += 2 * size) {
          const m = Math.min(l + size - 1, n - 1);
          const r = Math.min(l + 2 * size - 1, n - 1);
          if (m < r) merge(l, m, r);
        }
        size *= 2;
      }
      return steps;
    },
    docs: {
      "intuition": "Tim Sort (used internally by Python and Java) is a hybrid: it splits the array into small fixed-size 'runs', sorts each run with Insertion Sort (which is very fast on small arrays), then merges the sorted runs together exactly like Merge Sort. This visualizer shows a simplified version with a fixed run size; the real Tim Sort additionally detects naturally-occurring ascending/descending runs in the data and adapts its merge strategy for extra speed on partially-sorted input.",
      "best": "O(n)",
      "bestWhy": "The real Tim Sort detects already-sorted (or reverse-sorted) runs directly and simply extends them without any comparisons beyond confirming the run, letting it finish a fully-sorted array in linear time.",
      "avg": "O(n log n)",
      "avgWhy": "Small runs sorted by Insertion Sort cost O(RUN²) each but there are n/RUN of them, giving O(n × RUN); the merge phase costs O(n log(n/RUN)) — combined this stays O(n log n) for reasonable run sizes.",
      "worst": "O(n log n)",
      "worstWhy": "Even in the worst case, the run-then-merge structure guarantees the same O(n log n) bound as standard Merge Sort, since merging sorted runs is always linear per level and there are always O(log n) merge levels.",
      "space": "O(n)",
      "spaceWhy": "Like Merge Sort, the merge step needs temporary arrays to hold the runs being combined, giving O(n) auxiliary space in the worst case."
    }
  },
  "intro": {
    name: "IntroSort",
    file: "introSort.js",
    code: [
      "function introSort(arr) {",
      "  let depthLimit = 2 * Math.floor(Math.log2(arr.length) + 1);",
      "  introRec(arr, 0, arr.length - 1, depthLimit);",
      "  return arr;",
      "}",
      "",
      "function introRec(arr, lo, hi, depthLimit) {",
      "  while (hi - lo > 16) {",
      "    if (depthLimit === 0) { heapSort(arr, lo, hi); return; }",
      "    depthLimit--;",
      "    let p = partition(arr, lo, hi);   // Quick Sort partition",
      "    introRec(arr, lo, p - 1, depthLimit);",
      "    lo = p + 1;",
      "  }",
      "  insertionSort(arr, lo, hi);          // cheap for small ranges",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice(); const n = a.length; const steps = [];
      function insertionSort(l, r) {
        for (let i = l + 1; i <= r; i++) {
          let temp = a[i]; let j = i - 1;
          while (j >= l) {
            steps.push({ line: 16, type: "compare", indices: [j, i] });
            if (a[j] > temp) { steps.push({ line: 16, type: "overwrite", index: j + 1, value: a[j] }); a[j + 1] = a[j]; j--; }
            else break;
          }
          steps.push({ line: 16, type: "overwrite", index: j + 1, value: temp });
          a[j + 1] = temp;
        }
      }
      function heapify(l, size, i) {
        let largest = i, left = 2 * (i - l) + 1 + l, right = 2 * (i - l) + 2 + l;
        if (left < l + size) { steps.push({ line: 10, type: "compare", indices: [left, largest] }); if (a[left] > a[largest]) largest = left; }
        if (right < l + size) { steps.push({ line: 10, type: "compare", indices: [right, largest] }); if (a[right] > a[largest]) largest = right; }
        if (largest !== i) { steps.push({ line: 10, type: "swap", indices: [i, largest] }); [a[i], a[largest]] = [a[largest], a[i]]; heapify(l, size, largest); }
      }
      function heapSort(l, r) {
        const size = r - l + 1;
        for (let i = l + Math.floor(size / 2) - 1; i >= l; i--) heapify(l, size, i);
        for (let i = r; i > l; i--) { steps.push({ line: 10, type: "swap", indices: [l, i] }); [a[l], a[i]] = [a[i], a[l]]; heapify(l, i - l, l); }
      }
      function partition(l, r) {
        steps.push({ line: 11, type: "pivot", index: r });
        const pivot = a[r]; let i = l - 1;
        for (let j = l; j < r; j++) {
          steps.push({ line: 11, type: "compare", indices: [j, r] });
          if (a[j] < pivot) { i++; if (i !== j) { steps.push({ line: 11, type: "swap", indices: [i, j] }); [a[i], a[j]] = [a[j], a[i]]; } }
        }
        steps.push({ line: 11, type: "swap", indices: [i + 1, r] });
        [a[i + 1], a[r]] = [a[r], a[i + 1]];
        return i + 1;
      }
      function introRec(l, r, depthLimit) {
        while (r - l > 16) {
          if (depthLimit === 0) { heapSort(l, r); return; }
          depthLimit--;
          const p = partition(l, r);
          introRec(l, p - 1, depthLimit);
          l = p + 1;
        }
        insertionSort(l, r);
      }
      const depthLimit = 2 * Math.floor(Math.log2(Math.max(n, 1)) + 1);
      introRec(0, n - 1, depthLimit);
      return steps;
    },
    docs: {
      "intuition": "IntroSort (used internally by C++'s std::sort) is Quick Sort with a safety net: it starts partitioning like ordinary Quick Sort for speed, but tracks its recursion depth — if the depth exceeds a limit of about 2⌊log₂n⌋ (a sign the pivots are consistently unlucky and Quick Sort is heading toward its O(n²) worst case), it switches that sub-range to Heap Sort, which is guaranteed O(n log n). For small ranges (≤ 60 elements) it switches to Insertion Sort, which has the lowest constant-factor overhead on tiny arrays.",
      "best": "O(n log n)",
      "bestWhy": "In the common case Quick Sort's partitions stay balanced, so the depth limit is never reached — IntroSort behaves exactly like ordinary Quick Sort, which is O(n log n) when pivots split evenly.",
      "avg": "O(n log n)",
      "avgWhy": "For typical random data, Quick Sort partitioning alone already averages O(n log n), so the Heap Sort fallback almost never triggers — IntroSort inherits Quick Sort's excellent average-case constant factor.",
      "worst": "O(n log n)",
      "worstWhy": "This is IntroSort's entire purpose: unlike plain Quick Sort, the depth-limited fallback to Heap Sort guarantees the worst case can never exceed O(n log n), eliminating Quick Sort's quadratic Achilles' heel.",
      "space": "O(log n)",
      "spaceWhy": "The Quick Sort partitioning is in place, needing only O(log n) recursion stack space on average; the Heap Sort fallback (when triggered) is also in place, so the combined algorithm never needs more than logarithmic extra space."
    }
  },
  "smooth": {
    name: "Smooth Sort (simplified)",
    file: "smoothSort.js",
    code: [
      "// Simplified, correctness-preserving illustration of Smooth Sort's",
      "// core idea: build a heap incrementally (adaptive — cheap on nearly-",
      "// sorted input) instead of Heap Sort's all-at-once O(n) heap build.",
      "function smoothSort(arr) {",
      "  for (let i = 0; i < arr.length; i++) siftUp(arr, i);",
      "  for (let end = arr.length - 1; end > 0; end--) {",
      "    swap(arr[0], arr[end]);",
      "    siftDown(arr, 0, end);",
      "  }",
      "  return arr;",
      "}",
      "",
      "function siftUp(arr, i) {",
      "  while (i > 0) {",
      "    let parent = Math.floor((i - 1) / 2);",
      "    if (arr[parent] < arr[i]) { swap(arr[parent], arr[i]); i = parent; }",
      "    else break;",
      "  }",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice(); const n = a.length; const steps = [];
      function siftUp(i) {
        while (i > 0) {
          const parent = Math.floor((i - 1) / 2);
          steps.push({ line: 15, type: "compare", indices: [parent, i] });
          if (a[parent] < a[i]) { steps.push({ line: 15, type: "swap", indices: [parent, i] }); [a[parent], a[i]] = [a[i], a[parent]]; i = parent; }
          else break;
        }
      }
      function siftDown(i, size) {
        while (true) {
          let largest = i, l = 2 * i + 1, r = 2 * i + 2;
          if (l < size) { steps.push({ line: 8, type: "compare", indices: [l, largest] }); if (a[l] > a[largest]) largest = l; }
          if (r < size) { steps.push({ line: 8, type: "compare", indices: [r, largest] }); if (a[r] > a[largest]) largest = r; }
          if (largest === i) break;
          steps.push({ line: 8, type: "swap", indices: [i, largest] });
          [a[i], a[largest]] = [a[largest], a[i]];
          i = largest;
        }
      }
      for (let i = 0; i < n; i++) siftUp(i);
      for (let end = n - 1; end > 0; end--) {
        steps.push({ line: 7, type: "swap", indices: [0, end] });
        [a[0], a[end]] = [a[end], a[0]];
        steps.push({ line: 7, type: "sorted", index: end });
        siftDown(0, end);
      }
      return steps;
    },
    docs: {
      "intuition": "The real Smooth Sort (Dijkstra, 1981) builds a forest of variable-sized 'Leonardo heaps' so that if the input is already partly sorted, very little rearranging work is needed — it's adaptive, degrading gracefully toward O(n) as the input approaches sorted order, something ordinary Heap Sort cannot do. That structure is intricate to implement correctly, so this visualizer illustrates the same *core idea* — build the heap incrementally, one insertion at a time, instead of Heap Sort's bulk O(n) build — using an ordinary binary heap. This keeps the adaptive, incremental-construction spirit of Smooth Sort while remaining simple to follow.",
      "best": "O(n)",
      "bestWhy": "On already-sorted input, real Smooth Sort's Leonardo-heap construction needs almost no swaps at all, since each new element is already in a valid heap position relative to what's been built so far.",
      "avg": "O(n log n)",
      "avgWhy": "For random data, both the true Leonardo-heap version and this simplified incremental-heap version need roughly logarithmic work per insertion and per extraction, giving O(n log n) overall — matching Heap Sort's average case.",
      "worst": "O(n log n)",
      "worstWhy": "Even in the worst case, heap operations (real Leonardo heaps or the binary heap shown here) never exceed O(log n) per step, so the total across n insertions and n extractions stays O(n log n) — Smooth Sort shares Heap Sort's guaranteed ceiling.",
      "space": "O(1)",
      "spaceWhy": "Both the real algorithm and this simplified version rearrange elements directly inside the original array — only a handful of scalar index variables are used, no auxiliary array."
    }
  },
  "tournament": {
    name: "Tournament Sort",
    file: "tournamentSort.js",
    code: [
      "// Selection Sort accelerated with a 'tournament' (winner) idea:",
      "// find the current minimum by playing pairwise comparisons.",
      "function tournamentSort(arr) {",
      "  let n = arr.length;",
      "  let used = new Array(n).fill(false);",
      "  let output = [];",
      "  for (let pick = 0; pick < n; pick++) {",
      "    let minIdx = -1;",
      "    for (let i = 0; i < n; i++) {",
      "      if (used[i]) continue;",
      "      if (minIdx === -1 || arr[i] < arr[minIdx]) minIdx = i;",
      "    }",
      "    output.push(arr[minIdx]);",
      "    used[minIdx] = true;",
      "  }",
      "  return output;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice(); const n = a.length; const steps = [];
      const work = a.slice();
      const usedMark = new Array(n).fill(false);
      for (let pick = 0; pick < n; pick++) {
        let minIdx = -1;
        for (let i = 0; i < n; i++) {
          if (usedMark[i]) continue;
          if (minIdx === -1) { minIdx = i; continue; }
          steps.push({ line: 10, type: "compare", indices: [i, minIdx] });
          if (work[i] < work[minIdx]) minIdx = i;
        }
        steps.push({ line: 13, type: "overwrite", index: pick, value: work[minIdx] });
        a[pick] = work[minIdx];
        usedMark[minIdx] = true;
      }
      return steps;
    },
    docs: {
      "intuition": "Tournament Sort picks the minimum the way a knockout tournament picks a champion: every remaining element 'plays' pairwise comparisons and the smallest value wins each round, repeating for n rounds. A true tournament-tree implementation reuses the results of earlier comparisons across rounds by remembering match outcomes in a binary tree (finding each successive minimum in O(log n) instead of O(n)); this visualizer shows the straightforward version that re-scans for clarity.",
      "best": "O(n²)",
      "bestWhy": "This simplified version always scans every remaining element to confirm the current minimum, regardless of input order — the comparison count never changes even for already-sorted data.",
      "avg": "O(n²)",
      "avgWhy": "Selecting the minimum from the remaining unplaced elements n times, each requiring a full scan, gives the same n + (n−1) + … + 1 = O(n²) total comparisons as ordinary Selection Sort.",
      "worst": "O(n²)",
      "worstWhy": "No arrangement of input changes the number of comparisons in this scanning implementation — it is bounded by n(n−1)/2 regardless (a true winner-tree implementation instead achieves O(n log n) by reusing comparison results).",
      "space": "O(n)",
      "spaceWhy": "A used[] marker array of size n (or, in a true implementation, an explicit binary tournament tree of n−1 internal nodes) is needed alongside the input."
    }
  },
  "extmerge": {
    name: "External Merge Sort",
    file: "externalMergeSort.js",
    code: [
      "// Simulates disk-based sorting: split into memory-sized 'pages',",
      "// sort each page in memory, then repeatedly k-way merge pages.",
      "function externalMergeSort(arr, pageSize) {",
      "  let runs = [];",
      "  for (let i = 0; i < arr.length; i += pageSize) {",
      "    let page = arr.slice(i, i + pageSize).sort((a, b) => a - b);",
      "    runs.push(page);          // write sorted 'page' back to its slot",
      "  }",
      "  while (runs.length > 1) {",
      "    let merged = [];",
      "    for (let i = 0; i < runs.length; i += 2) {",
      "      merged.push(i + 1 < runs.length ? merge(runs[i], runs[i + 1]) : runs[i]);",
      "    }",
      "    runs = merged;",
      "  }",
      "  return runs[0];",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice(); const n = a.length; const steps = [];
      const pageSize = Math.max(2, Math.ceil(Math.sqrt(n)));
      let runs = [];
      for (let i = 0; i < n; i += pageSize) {
        const chunk = a.slice(i, Math.min(i + pageSize, n));
        for (let x = 1; x < chunk.length; x++) {
          let temp = chunk[x]; let y = x - 1;
          while (y >= 0 && chunk[y] > temp) { chunk[y + 1] = chunk[y]; y--; }
          chunk[y + 1] = temp;
        }
        for (let k = 0; k < chunk.length; k++) { steps.push({ line: 6, type: "overwrite", index: i + k, value: chunk[k] }); a[i + k] = chunk[k]; }
        runs.push({ start: i, vals: chunk.slice() });
      }
      function mergeRuns(r1, r2) {
        const merged = []; let i = 0, j = 0;
        while (i < r1.vals.length && j < r2.vals.length) {
          steps.push({ line: 12, type: "compare", indices: [r1.start + i, r2.start + j] });
          if (r1.vals[i] <= r2.vals[j]) merged.push(r1.vals[i++]); else merged.push(r2.vals[j++]);
        }
        while (i < r1.vals.length) merged.push(r1.vals[i++]);
        while (j < r2.vals.length) merged.push(r2.vals[j++]);
        for (let k = 0; k < merged.length; k++) { steps.push({ line: 12, type: "overwrite", index: r1.start + k, value: merged[k] }); a[r1.start + k] = merged[k]; }
        return { start: r1.start, vals: merged };
      }
      while (runs.length > 1) {
        const newRuns = [];
        for (let i = 0; i < runs.length; i += 2) newRuns.push(i + 1 < runs.length ? mergeRuns(runs[i], runs[i + 1]) : runs[i]);
        runs = newRuns;
      }
      return steps;
    },
    docs: {
      "intuition": "External Merge Sort is designed for data too large to fit in memory: it splits the data into memory-sized 'pages', sorts each page independently in memory, writes the sorted pages back, and then repeatedly merges pairs of sorted runs together (each merge only needs a small read buffer, not the whole run in memory) until a single fully-sorted run remains. This visualizer simulates the idea using small in-memory 'pages' sized to √n.",
      "best": "O(n log n)",
      "bestWhy": "The merge structure is identical regardless of the initial page contents — sorting each page and then merging log(n/pageSize) times always costs the same amount of work.",
      "avg": "O(n log n)",
      "avgWhy": "Each of the log(runs) merge levels processes all n elements once (O(n) per level), matching Merge Sort's average behaviour — the only difference from ordinary Merge Sort is that runs start out page-sorted rather than single elements.",
      "worst": "O(n log n)",
      "worstWhy": "Like standard Merge Sort, every merge pass is guaranteed linear in the number of elements it touches, and the number of passes is logarithmic in the number of runs — no input can push this above O(n log n).",
      "space": "O(n)",
      "spaceWhy": "Each merge step needs a full temporary array for the merged run — in true external sorting, disk I/O buffers replace this, but the in-memory simulation here still needs O(n) auxiliary space."
    }
  },
  "parmerge": {
    name: "Parallel Merge Sort",
    file: "parallelMergeSort.js",
    code: [
      "// In real parallel hardware, the two recursive calls below run",
      "// simultaneously on separate cores/threads instead of one after",
      "// another — the merge logic itself is identical to ordinary Merge Sort.",
      "function parallelMergeSort(arr, l, r) {",
      "  if (l >= r) return;",
      "  let m = Math.floor((l + r) / 2);",
      "  spawn(() => parallelMergeSort(arr, l, m));      // runs on core A",
      "  spawn(() => parallelMergeSort(arr, m + 1, r));  // runs on core B",
      "  joinBothTasks();",
      "  merge(arr, l, m, r);",
      "  return arr;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice(); const n = a.length; const steps = [];
      function mergeSort(l, r) {
        if (l >= r) return;
        const m = Math.floor((l + r) / 2);
        mergeSort(l, m); mergeSort(m + 1, r);
        const left = a.slice(l, m + 1), right = a.slice(m + 1, r + 1);
        let i = 0, j = 0, k = l;
        while (i < left.length && j < right.length) {
          steps.push({ line: 10, type: "compare", indices: [l + i, m + 1 + j] });
          if (left[i] <= right[j]) { steps.push({ line: 10, type: "overwrite", index: k, value: left[i] }); a[k++] = left[i++]; }
          else { steps.push({ line: 10, type: "overwrite", index: k, value: right[j] }); a[k++] = right[j++]; }
        }
        while (i < left.length) { steps.push({ line: 10, type: "overwrite", index: k, value: left[i] }); a[k++] = left[i++]; }
        while (j < right.length) { steps.push({ line: 10, type: "overwrite", index: k, value: right[j] }); a[k++] = right[j++]; }
      }
      mergeSort(0, n - 1);
      return steps;
    },
    docs: {
      "intuition": "Parallel Merge Sort takes ordinary Merge Sort's two recursive halves and runs them on separate processors/threads at the same time instead of one after another, since the two halves are completely independent until the final merge step. This visualizer plays out the exact same comparisons and merges sequentially (a single browser tab has no real parallel cores to demonstrate), but the underlying divide-and-conquer structure shown is exactly what gets distributed across cores in a real parallel implementation.",
      "best": "O(log n) with unlimited processors",
      "bestWhy": "With one processor per sub-array, all the recursive splitting happens simultaneously across O(log n) depth levels, and merges at each level can also be parallelised down to O(log n) per merge — the theoretical parallel best case is polylogarithmic.",
      "avg": "O((n log n) / p)",
      "avgWhy": "With p real (finite) processors, the total O(n log n) sequential work gets divided roughly evenly across p workers, so wall-clock time drops proportionally to p, though it never falls below the O(n log n) work divided by the merge step's own dependency chain.",
      "worst": "O(n log n) work, O(log² n) time (unlimited processors)",
      "worstWhy": "Even with unlimited parallel processors, information still needs to propagate up through log n merge levels, and each merge level takes O(log n) parallel time to combine — giving a parallel worst-case time of O(log² n), while the total work summed across all processors remains O(n log n).",
      "space": "O(n)",
      "spaceWhy": "Just like sequential Merge Sort, each merge step needs temporary arrays to hold the two halves being combined — this doesn't change when the recursive calls happen in parallel."
    }
  },
  "parquick": {
    name: "Parallel Quick Sort",
    file: "parallelQuickSort.js",
    code: [
      "// The two recursive calls after partitioning are completely",
      "// independent of each other, so real parallel implementations",
      "// dispatch them to separate cores/threads simultaneously.",
      "function parallelQuickSort(arr, lo, hi) {",
      "  if (lo < hi) {",
      "    let p = partition(arr, lo, hi);",
      "    spawn(() => parallelQuickSort(arr, lo, p - 1));  // core A",
      "    spawn(() => parallelQuickSort(arr, p + 1, hi));  // core B",
      "    joinBothTasks();",
      "  }",
      "  return arr;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice(); const n = a.length; const steps = [];
      function partition(l, r) {
        steps.push({ line: 6, type: "pivot", index: r });
        const pivot = a[r]; let i = l - 1;
        for (let j = l; j < r; j++) {
          steps.push({ line: 6, type: "compare", indices: [j, r] });
          if (a[j] < pivot) { i++; if (i !== j) { steps.push({ line: 6, type: "swap", indices: [i, j] }); [a[i], a[j]] = [a[j], a[i]]; } }
        }
        steps.push({ line: 6, type: "swap", indices: [i + 1, r] });
        [a[i + 1], a[r]] = [a[r], a[i + 1]];
        return i + 1;
      }
      function qs(l, r) { if (l < r) { const p = partition(l, r); qs(l, p - 1); qs(p + 1, r); } }
      qs(0, n - 1);
      return steps;
    },
    docs: {
      "intuition": "Parallel Quick Sort uses the exact same partitioning step as ordinary Quick Sort (pick a pivot, move smaller elements left and larger ones right), but once partitioning is done, the two resulting sub-arrays are completely independent of each other and get dispatched to separate cores/threads to be sorted simultaneously, rather than one after the other. This visualizer plays the identical partition-and-recurse steps out sequentially to show the logic clearly.",
      "best": "O(log n) with unlimited processors",
      "bestWhy": "With a new processor available for every recursive call and perfectly balanced pivots, the recursion tree has depth O(log n), and each level's partitioning can itself be parallelised, giving a theoretical best of O(log n) parallel time.",
      "avg": "O((n log n) / p)",
      "avgWhy": "With p processors and typically-balanced pivots, the O(n log n) total sequential work spreads roughly evenly across available processors, giving a proportional speed-up until the number of processors exceeds the available parallelism in the recursion tree.",
      "worst": "O(n) parallel time (unlimited processors), O(n²) total work",
      "worstWhy": "Consistently unbalanced pivots (e.g. sorted input with a naive last-element pivot) create a skewed recursion tree of depth O(n) — even with unlimited processors, each level must still wait for the single unbalanced partition above it, and the total work across all processors is still O(n²), same as sequential Quick Sort's worst case.",
      "space": "O(log n) average, O(n) worst case",
      "spaceWhy": "Partitioning happens in place, but every parallel recursive call needs its own stack frame — a balanced split needs only O(log n) depth, while a skewed one needs O(n)."
    }
  },
  "sample": {
    name: "Sample Sort",
    file: "sampleSort.js",
    code: [
      "// Generalisation of Quick Sort to many buckets at once — the",
      "// natural parallel/distributed sorting algorithm, since each",
      "// bucket can be sorted independently on a separate processor.",
      "function sampleSort(arr, numBuckets) {",
      "  let splitters = pickSplitters(arr, numBuckets);  // (numBuckets-1) values",
      "  let buckets = Array.from({ length: numBuckets }, () => []);",
      "  for (let v of arr) {",
      "    let idx = findBucketIndex(v, splitters);",
      "    buckets[idx].push(v);",
      "  }",
      "  let output = [];",
      "  for (let bucket of buckets) {",
      "    bucket.sort((a, b) => a - b);   // each bucket sorted independently",
      "    output.push(...bucket);",
      "  }",
      "  return output;",
      "}"
    ],
    generate: function generate(arr) {
      const a = arr.slice(); const n = a.length; const steps = [];
      if (n === 0) return steps;
      const numBuckets = Math.max(1, Math.min(8, Math.floor(Math.sqrt(n))));
      const sortedRef = a.slice().sort((x, y) => x - y);
      const splitters = [];
      for (let i = 1; i < numBuckets; i++) splitters.push(sortedRef[Math.floor((i * n) / numBuckets)]);
      const buckets = Array.from({ length: numBuckets }, () => []);
      for (let i = 0; i < n; i++) {
        let idx = 0;
        while (idx < splitters.length && a[i] > splitters[idx]) { steps.push({ line: 8, type: "compare", indices: [i, i] }); idx++; }
        buckets[idx].push(a[i]);
      }
      const out = [];
      for (const b of buckets) { b.sort((x, y) => x - y); out.push(...b); }
      for (let i = 0; i < n; i++) steps.push({ line: 13, type: "overwrite", index: i, value: out[i] });
      return steps;
    },
    docs: {
      "intuition": "Sample Sort generalises Quick Sort's single pivot into multiple 'splitter' values, which divide the data into many buckets at once instead of just two. A small sample of the data is used to pick splitters that (on uniform data) divide the input into roughly equal-sized buckets; each bucket is then sorted independently — perfect for distributing across many processors, since sorting one bucket has no dependency on any other.",
      "best": "O(n log n)",
      "bestWhy": "If the sample perfectly represents the data distribution, every bucket ends up the same size (n / numBuckets), and sorting all buckets in parallel (or even sequentially) costs O(n log n) total, same as any comparison sort.",
      "avg": "O(n log n)",
      "avgWhy": "For reasonably well-chosen splitters, bucket sizes stay close to balanced, so distributing elements costs O(n) and sorting the buckets (which together hold n elements) costs O(n log n) — matching Quick Sort's average case, which Sample Sort generalises.",
      "worst": "O(n²)",
      "worstWhy": "If the chosen splitters are poor (e.g. all sample values happen to be clustered), one bucket can end up holding almost all n elements, and sorting that oversized bucket degrades to whatever the per-bucket comparison sort's worst case is.",
      "space": "O(n)",
      "spaceWhy": "The bucket structures need O(n) total space to hold every element split across buckets, in addition to the O(numBuckets) space for splitter values."
    }
  },
};
