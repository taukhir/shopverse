export type CodingSolution = {
  approach: string;
  complexity: string;
  code: string;
  notes: string[];
};

export const walmartCodingSolutions: Record<number, CodingSolution> = {
  197: {
    approach: 'Scan once and store each value with its index. Before storing the current value, look up the complement required to reach the target.',
    complexity: 'Time O(n), space O(n).',
    notes: ['Check the complement before inserting to avoid reusing the same element.', 'Return indices, not values, unless the contract explicitly says otherwise.'],
    code: `import java.util.HashMap;
import java.util.Map;

class TwoSum {
    static int[] solve(int[] numbers, int target) {
        Map<Integer, Integer> indexByValue = new HashMap<>();
        for (int index = 0; index < numbers.length; index++) {
            int complement = target - numbers[index];
            if (indexByValue.containsKey(complement)) {
                return new int[] {indexByValue.get(complement), index};
            }
            indexByValue.put(numbers[index], index);
        }
        return new int[0];
    }
}`,
  },
  198: {
    approach: 'Sort intervals by start time, then merge into the last output interval whenever the next start is within its end.',
    complexity: 'Time O(n log n), space O(n) for the result.',
    notes: ['The ordering invariant is that the output is sorted and contains no overlapping adjacent intervals.', 'Decide whether touching intervals should merge before coding.'],
    code: `import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class MergeIntervals {
    static int[][] solve(int[][] intervals) {
        if (intervals.length == 0) return new int[0][];
        Arrays.sort(intervals, (left, right) -> Integer.compare(left[0], right[0]));
        List<int[]> merged = new ArrayList<>();
        for (int[] current : intervals) {
            if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < current[0]) {
                merged.add(current.clone());
            } else {
                int[] previous = merged.get(merged.size() - 1);
                previous[1] = Math.max(previous[1], current[1]);
            }
        }
        return merged.toArray(int[][]::new);
    }
}`,
  },
  199: {
    approach: 'Maintain the farthest reachable index. Every visited index must be within that frontier; extend it with the jump available there.',
    complexity: 'Time O(n), space O(1).',
    notes: ['The greedy invariant is that every index up to farthest is reachable.', 'Fail immediately when the scan index moves beyond the frontier.'],
    code: `class JumpGame {
    static boolean canReachEnd(int[] jumps) {
        int farthest = 0;
        for (int index = 0; index < jumps.length; index++) {
            if (index > farthest) return false;
            farthest = Math.max(farthest, index + jumps[index]);
            if (farthest >= jumps.length - 1) return true;
        }
        return true;
    }
}`,
  },
  200: {
    approach: 'Sort the values, fix one number, and move two pointers toward each other based on whether the three-number sum is too small or too large.',
    complexity: 'Time O(n²), excluding output; space O(1) beyond sorting and output.',
    notes: ['Skip duplicate fixed values and duplicate pointer values after recording a triplet.', 'Use a wider numeric type for the sum when inputs may overflow int.'],
    code: `import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class ThreeSum {
    static List<List<Integer>> solve(int[] values) {
        Arrays.sort(values);
        List<List<Integer>> result = new ArrayList<>();
        for (int first = 0; first < values.length - 2; first++) {
            if (first > 0 && values[first] == values[first - 1]) continue;
            int left = first + 1;
            int right = values.length - 1;
            while (left < right) {
                long sum = (long) values[first] + values[left] + values[right];
                if (sum < 0) left++;
                else if (sum > 0) right--;
                else {
                    result.add(List.of(values[first], values[left], values[right]));
                    int leftValue = values[left];
                    int rightValue = values[right];
                    while (left < right && values[left] == leftValue) left++;
                    while (left < right && values[right] == rightValue) right--;
                }
            }
        }
        return result;
    }
}`,
  },
  201: {
    approach: 'Use bottom-up dynamic programming where dp[amount] is the fewest coins needed for that amount. Relax every reachable amount with every coin.',
    complexity: 'Time O(amount × coin count), space O(amount).',
    notes: ['Use amount + 1 as an unreachable sentinel to avoid overflow.', 'Return -1 when the target remains unreachable.'],
    code: `import java.util.Arrays;

class CoinChange {
    static int minimumCoins(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;
        for (int current = 1; current <= amount; current++) {
            for (int coin : coins) {
                if (coin <= current) {
                    dp[current] = Math.min(dp[current], dp[current - coin] + 1);
                }
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
}`,
  },
  202: {
    approach: 'Sort meetings by start time and keep active end times in a min-heap. Reuse every room whose meeting has ended before adding the current meeting.',
    complexity: 'Time O(n log n), space O(n).',
    notes: ['The heap size is the number of rooms currently in use.', 'The maximum heap size is the minimum number of rooms required.'],
    code: `import java.util.Arrays;
import java.util.PriorityQueue;

class MeetingRooms {
    static int minimumRooms(int[][] meetings) {
        Arrays.sort(meetings, (left, right) -> Integer.compare(left[0], right[0]));
        PriorityQueue<Integer> endTimes = new PriorityQueue<>();
        int maximumRooms = 0;
        for (int[] meeting : meetings) {
            while (!endTimes.isEmpty() && endTimes.peek() <= meeting[0]) {
                endTimes.poll();
            }
            endTimes.offer(meeting[1]);
            maximumRooms = Math.max(maximumRooms, endTimes.size());
        }
        return maximumRooms;
    }
}`,
  },
  203: {
    approach: 'XOR every expected number from 0 through n with every observed number. Equal values cancel, leaving the missing value.',
    complexity: 'Time O(n), space O(1).',
    notes: ['This assumes exactly one value is missing and there are no duplicates.', 'The XOR approach avoids arithmetic overflow.'],
    code: `class MissingNumber {
    static int find(int[] values) {
        int missing = values.length;
        for (int index = 0; index < values.length; index++) {
            missing ^= index ^ values[index];
        }
        return missing;
    }
}`,
  },
  204: {
    approach: 'Use a sliding window and remember the last index of each character. Move the left boundary past a repeated character only when it lies inside the current window.',
    complexity: 'Time O(n), space O(k), where k is the character set size.',
    notes: ['Never move the left boundary backward.', 'Clarify whether indexing Java UTF-16 code units is acceptable or Unicode code points are required.'],
    code: `import java.util.HashMap;
import java.util.Map;

class LongestUniqueSubstring {
    static int length(String value) {
        Map<Character, Integer> lastSeen = new HashMap<>();
        int left = 0;
        int best = 0;
        for (int right = 0; right < value.length(); right++) {
            char current = value.charAt(right);
            left = Math.max(left, lastSeen.getOrDefault(current, -1) + 1);
            lastSeen.put(current, right);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}`,
  },
  205: {
    approach: 'Use pointer rewiring for reversal, slow/fast pointers for cycle detection, and a sentinel node for ordered merging.',
    complexity: 'Each operation runs in O(n) time and O(1) auxiliary space.',
    notes: ['Save next before rewiring a link during reversal.', 'The merge reuses existing nodes; clone them if ownership requires immutability.'],
    code: `class LinkedListAlgorithms {
    static final class Node {
        int value;
        Node next;
        Node(int value) { this.value = value; }
    }

    static Node reverse(Node head) {
        Node previous = null;
        while (head != null) {
            Node next = head.next;
            head.next = previous;
            previous = head;
            head = next;
        }
        return previous;
    }

    static boolean hasCycle(Node head) {
        Node slow = head;
        Node fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }

    static Node mergeSorted(Node left, Node right) {
        Node sentinel = new Node(0);
        Node tail = sentinel;
        while (left != null && right != null) {
            if (left.value <= right.value) {
                tail.next = left;
                left = left.next;
            } else {
                tail.next = right;
                right = right.next;
            }
            tail = tail.next;
        }
        tail.next = left != null ? left : right;
        return sentinel.next;
    }
}`,
  },
  206: {
    approach: 'Move two pointers inward. The side with the lower boundary determines the water that can be finalized at that step.',
    complexity: 'Time O(n), space O(1).',
    notes: ['Water at an index is bounded by the smaller maximum wall on its two sides.', 'Accumulating into long is safer when the input size or heights are large.'],
    code: `class TrappingRainWater {
    static long trapped(int[] heights) {
        int left = 0;
        int right = heights.length - 1;
        int leftMaximum = 0;
        int rightMaximum = 0;
        long water = 0;
        while (left < right) {
            if (heights[left] <= heights[right]) {
                leftMaximum = Math.max(leftMaximum, heights[left]);
                water += leftMaximum - heights[left++];
            } else {
                rightMaximum = Math.max(rightMaximum, heights[right]);
                water += rightMaximum - heights[right--];
            }
        }
        return water;
    }
}`,
  },
  207: {
    approach: 'Maintain one stack for values and another for the minimum seen at each depth. Push to and pop from both stacks together.',
    complexity: 'O(1) time per operation, O(n) space.',
    notes: ['Store repeated minimum values so duplicate minima pop correctly.', 'Throw a clear exception for operations on an empty stack.'],
    code: `import java.util.ArrayDeque;
import java.util.Deque;
import java.util.NoSuchElementException;

class MinStack {
    private final Deque<Integer> values = new ArrayDeque<>();
    private final Deque<Integer> minimums = new ArrayDeque<>();

    void push(int value) {
        values.push(value);
        minimums.push(minimums.isEmpty() ? value : Math.min(value, minimums.peek()));
    }

    int pop() {
        requireValue();
        minimums.pop();
        return values.pop();
    }

    int minimum() {
        requireValue();
        return minimums.peek();
    }

    private void requireValue() {
        if (values.isEmpty()) throw new NoSuchElementException("stack is empty");
    }
}`,
  },
  208: {
    approach: 'Adapt binary search for an array where each value may be displaced by one position: inspect mid and both neighbors, then skip the inspected pair.',
    complexity: 'Time O(log n), space O(1).',
    notes: ['This solution assumes every element moved at most one index from its sorted position.', 'State that assumption because “nearly sorted” can have other definitions.'],
    code: `class NearlySortedSearch {
    static int find(int[] values, int target) {
        int left = 0;
        int right = values.length - 1;
        while (left <= right) {
            int middle = left + (right - left) / 2;
            if (values[middle] == target) return middle;
            if (middle > left && values[middle - 1] == target) return middle - 1;
            if (middle < right && values[middle + 1] == target) return middle + 1;
            if (values[middle] < target) left = middle + 2;
            else right = middle - 2;
        }
        return -1;
    }
}`,
  },
  209: {
    approach: 'XOR the complete expected label range with every node value encountered during traversal. Matching labels cancel and leave the missing label.',
    complexity: 'Time O(n), recursion space O(h), where h is tree height.',
    notes: ['This assumes unique node labels from 1 through n with exactly one missing.', 'Use an explicit stack instead of recursion for an adversarially deep tree.'],
    code: `class MissingTreeLabel {
    static final class Node {
        int value;
        Node left;
        Node right;
        Node(int value) { this.value = value; }
    }

    static int find(Node root, int expectedMaximum) {
        int missing = 0;
        for (int value = 1; value <= expectedMaximum; value++) missing ^= value;
        return missing ^ xorTree(root);
    }

    private static int xorTree(Node node) {
        if (node == null) return 0;
        return node.value ^ xorTree(node.left) ^ xorTree(node.right);
    }
}`,
  },
};
