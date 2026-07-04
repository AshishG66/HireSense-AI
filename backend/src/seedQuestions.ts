import { PrismaClient } from '@prisma/client';
import env from './config/env';

const dbUrl = env.DATABASE_URL.includes('?') 
  ? `${env.DATABASE_URL}&connection_limit=1`
  : `${env.DATABASE_URL}?connection_limit=1`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

async function retryPrisma<T>(fn: () => Promise<T>, retries = 5, delay = 2000): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      console.log(`Prisma query failed (attempt ${i + 1}/${retries}). Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastErr;
}

async function seed() {
  console.log("Seeding question bank with 100 normalized questions...");

  const questionTemplates = [
    // Arrays
    { title: "Two Sum", cat: "Arrays", diff: "EASY", desc: "Find two numbers in an array that add up to a target." },
    { title: "Container With Most Water", cat: "Arrays", diff: "MEDIUM", desc: "Find two lines that together with the x-axis forms a container containing the most water." },
    { title: "Median of Two Sorted Arrays", cat: "Arrays", diff: "HARD", desc: "Find the median of the two sorted arrays." },
    { title: "Best Time to Buy and Sell Stock", cat: "Arrays", diff: "EASY", desc: "Maximize your profit by choosing a single day to buy and another day in the future to sell." },
    { title: "3Sum", cat: "Arrays", diff: "MEDIUM", desc: "Find all unique triplets in the array which gives the sum of zero." },
    
    // Strings
    { title: "Valid Parentheses", cat: "Strings", diff: "EASY", desc: "Determine if the input string has valid matching brackets." },
    { title: "Longest Substring Without Repeating Characters", cat: "Strings", diff: "MEDIUM", desc: "Find the length of the longest substring without repeating characters." },
    { title: "Minimum Window Substring", cat: "Strings", diff: "HARD", desc: "Find the minimum window in S which will contain all the characters in T." },
    { title: "Reverse String", cat: "Strings", diff: "EASY", desc: "Reverse the given string in place." },
    { title: "Group Anagrams", cat: "Strings", diff: "MEDIUM", desc: "Group anagrams together from an array of strings." },

    // Linked Lists
    { title: "Reverse Linked List", cat: "Linked Lists", diff: "EASY", desc: "Reverse a singly linked list." },
    { title: "Add Two Numbers", cat: "Linked Lists", diff: "MEDIUM", desc: "Add two numbers represented as linked lists." },
    { title: "Merge k Sorted Lists", cat: "Linked Lists", diff: "HARD", desc: "Merge k sorted linked lists and return it as one sorted list." },
    { title: "Merge Two Sorted Lists", cat: "Linked Lists", diff: "EASY", desc: "Merge two sorted linked lists." },
    { title: "Remove Nth Node From End", cat: "Linked Lists", diff: "MEDIUM", desc: "Remove the N-th node from the end of a linked list." },

    // Trees
    { title: "Maximum Depth of Binary Tree", cat: "Trees", diff: "EASY", desc: "Find the maximum depth of a binary tree." },
    { title: "Binary Tree Level Order Traversal", cat: "Trees", diff: "MEDIUM", desc: "Return the level order traversal of a binary tree's nodes' values." },
    { title: "Binary Tree Maximum Path Sum", cat: "Trees", diff: "HARD", desc: "Find the maximum path sum of any path in a binary tree." },
    { title: "Invert Binary Tree", cat: "Trees", diff: "EASY", desc: "Invert a binary tree." },
    { title: "Validate Binary Search Tree", cat: "Trees", diff: "MEDIUM", desc: "Determine if a binary tree is a valid binary search tree." },

    // Graphs
    { title: "Find Center of Star Graph", cat: "Graphs", diff: "EASY", desc: "Find the center node of a star graph." },
    { title: "Number of Islands", cat: "Graphs", diff: "MEDIUM", desc: "Count the number of islands in a 2D grid." },
    { title: "Word Ladder", cat: "Graphs", diff: "HARD", desc: "Find the length of shortest transformation sequence from beginWord to endWord." },
    { title: "Clone Graph", cat: "Graphs", diff: "MEDIUM", desc: "Clone an undirected graph." },
    { title: "Course Schedule", cat: "Graphs", diff: "MEDIUM", desc: "Determine if you can finish all courses given prerequisite pairs." },

    // DP
    { title: "Climbing Stairs", cat: "DP", diff: "EASY", desc: "Find the number of distinct ways to climb to the top of a staircase." },
    { title: "Longest Common Subsequence", cat: "DP", diff: "MEDIUM", desc: "Find the length of the longest common subsequence of two strings." },
    { title: "Edit Distance", cat: "DP", diff: "HARD", desc: "Find the minimum number of operations required to convert word1 to word2." },
    { title: "Coin Change", cat: "DP", diff: "MEDIUM", desc: "Find the fewest number of coins that you need to make up a given amount." },
    { title: "House Robber", cat: "DP", diff: "MEDIUM", desc: "Maximize the amount of money you can rob without alerting police." },

    // Greedy
    { title: "Assign Cookies", cat: "Greedy", diff: "EASY", desc: "Maximize the number of children content with cookies." },
    { title: "Jump Game", cat: "Greedy", diff: "MEDIUM", desc: "Determine if you are able to reach the last index of an array." },
    { title: "Candy", cat: "Greedy", diff: "HARD", desc: "Minimize the total candy given to children under rating constraints." },
    { title: "Gas Station", cat: "Greedy", diff: "MEDIUM", desc: "Find the starting gas station index to complete the circuit." },
    { title: "Non-overlapping Intervals", cat: "Greedy", diff: "MEDIUM", desc: "Find the minimum number of intervals to remove to make the rest non-overlapping." },

    // Sorting
    { title: "Merge Sorted Array", cat: "Sorting", diff: "EASY", desc: "Merge two sorted arrays in place." },
    { title: "Kth Largest Element in an Array", cat: "Sorting", diff: "MEDIUM", desc: "Find the kth largest element in an unsorted array." },
    { title: "Sort Colors", cat: "Sorting", diff: "MEDIUM", desc: "Sort an array of red, white, and blue elements in place." },
    { title: "Maximum Gap", cat: "Sorting", diff: "HARD", desc: "Find the maximum gap between successive elements in sorted form." },
    { title: "Intersection of Two Arrays", cat: "Sorting", diff: "EASY", desc: "Find the intersection of two arrays." },

    // Searching
    { title: "Binary Search", cat: "Searching", diff: "EASY", desc: "Search for a target in a sorted array." },
    { title: "Search in Rotated Sorted Array", cat: "Searching", diff: "MEDIUM", desc: "Search a target in a rotated sorted array." },
    { title: "Find Minimum in Rotated Sorted Array", cat: "Searching", diff: "MEDIUM", desc: "Find the minimum element in a rotated sorted array." },
    { title: "First Bad Version", cat: "Searching", diff: "EASY", desc: "Find the first bad version of a product using binary search." },
    { title: "Find Peak Element", cat: "Searching", diff: "MEDIUM", desc: "Find a peak element in an array." },

    // Recursion
    { title: "Fibonacci Number", cat: "Recursion", diff: "EASY", desc: "Compute the N-th Fibonacci number recursively." },
    { title: "Power of Three", cat: "Recursion", diff: "EASY", desc: "Determine if an integer is a power of three." },
    { title: "Merge Two Binary Trees", cat: "Recursion", diff: "EASY", desc: "Merge two binary trees by summing overlapping node values." },
    { title: "Subsets", cat: "Recursion", diff: "MEDIUM", desc: "Return all possible subsets (power set) of a set." },
    { title: "Permutations", cat: "Recursion", diff: "MEDIUM", desc: "Return all possible permutations of distinct integers." },

    // Backtracking
    { title: "N-Queens", cat: "Backtracking", diff: "HARD", desc: "Solve the N-Queens puzzle by placing N queens on a board." },
    { title: "Generate Parentheses", cat: "Backtracking", diff: "MEDIUM", desc: "Generate all combinations of well-formed parentheses." },
    { title: "Word Search", cat: "Backtracking", diff: "MEDIUM", desc: "Determine if a word exists in a 2D grid." },
    { title: "Sudoku Solver", cat: "Backtracking", diff: "HARD", desc: "Solve a Sudoku puzzle by filling empty cells." },
    { title: "Combination Sum", cat: "Backtracking", diff: "MEDIUM", desc: "Find all unique combinations that sum up to a target." },

    // SQL / DBMS
    { title: "Select Duplicate Emails", cat: "SQL", diff: "EASY", desc: "Write a SQL query to find all duplicate emails in a Person table." },
    { title: "Employees Earning More Than Managers", cat: "SQL", diff: "EASY", desc: "Write a SQL query to find employees earning more than managers." },
    { title: "Second Highest Salary", cat: "SQL", diff: "MEDIUM", desc: "Write a SQL query to get the second highest salary from Employee table." },
    { title: "Department Highest Salary", cat: "SQL", diff: "MEDIUM", desc: "Write a SQL query to find employees who have the highest salary in each department." },
    { title: "Rank Scores", cat: "SQL", diff: "MEDIUM", desc: "Write a SQL query to rank scores in descending order." },

    // OS
    { title: "Producer-Consumer Problem Simulation", cat: "OS", diff: "MEDIUM", desc: "Simulate a synchronized buffer for producers and consumers." },
    { title: "FIFO Page Replacement Simulation", cat: "OS", diff: "EASY", desc: "Calculate page faults using the FIFO page replacement algorithm." },
    { title: "LRU Page Replacement Simulation", cat: "OS", diff: "MEDIUM", desc: "Calculate page faults using the Least Recently Used replacement algorithm." },
    { title: "SJF CPU Scheduling Simulation", cat: "OS", diff: "MEDIUM", desc: "Simulate Shortest Job First CPU scheduling queue." },
    { title: "Banker's Algorithm Safety Check", cat: "OS", diff: "HARD", desc: "Determine if a resource allocation state is safe in an operating system." },

    // Computer Networks
    { title: "IP Address Validator", cat: "Computer Networks", diff: "EASY", desc: "Validate if a given string is a valid IPv4 or IPv6 address." },
    { title: "CIDR Range Calculator", cat: "Computer Networks", diff: "MEDIUM", desc: "Calculate the range of IP addresses from a CIDR prefix notation." },
    { title: "Subnet Mask Converter", cat: "Computer Networks", diff: "EASY", desc: "Convert a subnet mask CIDR slash count to a dotted decimal string." },
    { title: "Dijkstra Routing Simulation", cat: "Computer Networks", diff: "MEDIUM", desc: "Simulate network routing using Dijkstra's shortest path." },
    { title: "Hamming Code Error Checker", cat: "Computer Networks", diff: "HARD", desc: "Implement Hamming Code generation and error correction." },

    // OOP
    { title: "Design a Parking Lot System", cat: "OOP", diff: "MEDIUM", desc: "Implement core classes for a multi-level parking lot system." },
    { title: "Design an LRU Cache System", cat: "OOP", diff: "MEDIUM", desc: "Implement the LRU Cache class structure with get and put methods." },
    { title: "Design a Vending Machine", cat: "OOP", diff: "MEDIUM", desc: "Implement classes for products, coins, and transaction states." },
    { title: "Implement Polymorphic Shapes", cat: "OOP", diff: "EASY", desc: "Define shape interfaces and override Area methods for circles and rectangles." },
    { title: "Design a Library Management System", cat: "OOP", diff: "MEDIUM", desc: "Implement classes for books, members, and reservation logs." }
  ];

  let i = 0;
  while (questionTemplates.length < 100) {
    const base = questionTemplates[i % questionTemplates.length];
    questionTemplates.push({
      title: `${base.title} II`,
      cat: base.cat,
      diff: base.diff === "EASY" ? "MEDIUM" : base.diff === "MEDIUM" ? "HARD" : "EASY",
      desc: `Advanced variation: ${base.desc}`
    });
    i++;
  }

  for (const q of questionTemplates) {
    const existing = await retryPrisma(() => prisma.codingQuestion.findFirst({
      where: { title: q.title }
    }));
    if (existing) continue;

    const fullDesc = `
${q.desc}

### Starter Codes

**Java**:
\`\`\`java
public class Solution {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}
\`\`\`

**Python**:
\`\`\`python
print("Hello")
\`\`\`

**C**:
\`\`\`c
#include <stdio.h>
int main() {
    printf("Hello");
    return 0;
}
\`\`\`

**C++**:
\`\`\`cpp
#include <iostream>
using namespace std;
int main() {
    cout << "Hello";
    return 0;
}
\`\`\`

**JavaScript**:
\`\`\`javascript
console.log("Hello");
\`\`\`

**TypeScript**:
\`\`\`typescript
console.log("Hello");
\`\`\`

### Reference Solution
\`\`\`
Print "Hello"
\`\`\`
    `;

    const created = await retryPrisma(() => prisma.codingQuestion.create({
      data: {
        title: q.title,
        description: fullDesc,
        difficulty: q.diff,
        points: q.diff === "EASY" ? 10 : q.diff === "MEDIUM" ? 20 : 30,
        category: q.cat,
        hints: ["Think about optimal time complexity.", "Break it down into subproblems."],
        editorial: "Reference standard textbook approach."
      }
    }));

    await retryPrisma(() => prisma.testCase.createMany({
      data: [
        {
          input: "5",
          expectedOutput: "Hello",
          isSample: true,
          isHidden: false,
          explanation: "Verification check",
          codingQuestionId: created.id
        },
        {
          input: "9",
          expectedOutput: "Hello",
          isSample: false,
          isHidden: true,
          explanation: "Hidden check",
          codingQuestionId: created.id
        }
      ]
    }));
  }

  const newCount = await retryPrisma(() => prisma.codingQuestion.count());
  console.log(`Seeding completed. Total questions in database: ${newCount}`);
}

seed().catch(err => {
  console.error("Seeding failed", err);
});
