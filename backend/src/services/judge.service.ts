import logger from '../lib/logger';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  JudgeProvider,
  ExecutionResult,
  TestCaseItem,
  SubmissionResult,
} from '../interfaces/judge.interface';

// -------------------------------------------------------------
// Java Signature Parser & Runner Generator
// -------------------------------------------------------------
interface JavaSignature {
  className: string;
  methodName: string;
  returnType: string;
  params: { type: string; name: string }[];
}

function parseJavaSignature(code: string): JavaSignature | null {
  const cleanCode = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');

  const classMatch = cleanCode.match(/class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : 'Solution';

  const methodRegex = /public\s+([A-Za-z0-9_<>[\]]+)\s+(\w+)\s*\(([^)]*)\)/g;
  let match;
  while ((match = methodRegex.exec(cleanCode)) !== null) {
    const returnType = match[1];
    const methodName = match[2];
    const paramsStr = match[3];

    if (methodName === className || methodName === 'main') {
      continue;
    }

    const params = paramsStr.trim() === '' ? [] : paramsStr.split(',').map(p => {
      const parts = p.trim().split(/\s+/);
      const name = parts.pop() || '';
      const type = parts.join(' ');
      return { type, name };
    });

    return { className, methodName, returnType, params };
  }
  return null;
}

function generateJavaRunner(signature: JavaSignature, inputStr: string): string {
  const parts = inputStr.split('\n');
  let argParsingCode = '';
  let invocationArgs: string[] = [];

  signature.params.forEach((param, index) => {
    const rawVal = parts[index] ? parts[index].trim() : '';
    const argName = `arg${index}`;
    invocationArgs.push(argName);

    if (param.type === 'int') {
      argParsingCode += `        int ${argName} = Integer.parseInt(${JSON.stringify(rawVal)}); \n`;
    } else if (param.type === 'long') {
      argParsingCode += `        long ${argName} = Long.parseLong(${JSON.stringify(rawVal)}); \n`;
    } else if (param.type === 'double') {
      argParsingCode += `        double ${argName} = Double.parseDouble(${JSON.stringify(rawVal)}); \n`;
    } else if (param.type === 'float') {
      argParsingCode += `        float ${argName} = Float.parseFloat(${JSON.stringify(rawVal)}); \n`;
    } else if (param.type === 'boolean') {
      argParsingCode += `        boolean ${argName} = Boolean.parseBoolean(${JSON.stringify(rawVal)}); \n`;
    } else if (param.type === 'char') {
      argParsingCode += `        char ${argName} = ${JSON.stringify(rawVal)}.charAt(0); \n`;
    } else if (param.type === 'String') {
      argParsingCode += `        String ${argName} = ${JSON.stringify(rawVal)}.replaceAll("^\\"|\\"$", ""); \n`;
    } else if (param.type === 'int[]') {
      argParsingCode += `        int[] ${argName} = Runner.parseIntArray(${JSON.stringify(rawVal)}); \n`;
    } else if (param.type === 'long[]') {
      argParsingCode += `        long[] ${argName} = Runner.parseLongArray(${JSON.stringify(rawVal)}); \n`;
    } else if (param.type === 'double[]') {
      argParsingCode += `        double[] ${argName} = Runner.parseDoubleArray(${JSON.stringify(rawVal)}); \n`;
    } else if (param.type === 'boolean[]') {
      argParsingCode += `        boolean[] ${argName} = Runner.parseBooleanArray(${JSON.stringify(rawVal)}); \n`;
    } else if (param.type === 'String[]') {
      argParsingCode += `        String[] ${argName} = Runner.parseStringArray(${JSON.stringify(rawVal)}); \n`;
    } else if (param.type === 'int[][]') {
      argParsingCode += `        int[][] ${argName} = Runner.parseInt2DArray(${JSON.stringify(rawVal)}); \n`;
    } else if (param.type === 'ListNode') {
      argParsingCode += `        ListNode ${argName} = Runner.parseListNode(${JSON.stringify(rawVal)}); \n`;
    } else if (param.type === 'TreeNode') {
      argParsingCode += `        TreeNode ${argName} = Runner.parseTreeNode(${JSON.stringify(rawVal)}); \n`;
    } else if (param.type.startsWith('List<List<')) {
      argParsingCode += `        List<List<Integer>> ${argName} = new ArrayList<>(); \n`;
      argParsingCode += `        for (int[] row : Runner.parseInt2DArray(${JSON.stringify(rawVal)})) { \n`;
      argParsingCode += `            List<Integer> r = new ArrayList<>(); for(int val : row) r.add(val); ${argName}.add(r); \n`;
      argParsingCode += `        } \n`;
    } else if (param.type.startsWith('List<Integer>')) {
      argParsingCode += `        List<Integer> ${argName} = new ArrayList<>(); \n`;
      argParsingCode += `        for (int val : Runner.parseIntArray(${JSON.stringify(rawVal)})) ${argName}.add(val); \n`;
    } else if (param.type.startsWith('List<String>')) {
      argParsingCode += `        List<String> ${argName} = Arrays.asList(Runner.parseStringArray(${JSON.stringify(rawVal)})); \n`;
    } else {
      argParsingCode += `        String ${argName} = ${JSON.stringify(rawVal)}; \n`;
    }
  });

  let outputSerialization = '';
  if (signature.returnType === 'void') {
    outputSerialization = `
        sol.${signature.methodName}(${invocationArgs.join(', ')});
        System.out.println("void");
    `;
  } else if (signature.returnType === 'ListNode') {
    outputSerialization = `
        ListNode res = sol.${signature.methodName}(${invocationArgs.join(', ')});
        System.out.println(Runner.serializeListNode(res));
    `;
  } else if (signature.returnType === 'TreeNode') {
    outputSerialization = `
        TreeNode res = sol.${signature.methodName}(${invocationArgs.join(', ')});
        System.out.println(Runner.serializeTreeNode(res));
    `;
  } else {
    outputSerialization = `
        Object res = sol.${signature.methodName}(${invocationArgs.join(', ')});
        System.out.println(Runner.serialize(res));
    `;
  }

  return `
import java.util.*;

public class Runner {
    // Input Parsers
    public static int[] parseIntArray(String s) {
        s = s.trim().replaceAll("^\\\\[|]$", "");
        if (s.isEmpty()) return new int[0];
        String[] parts = s.split(",");
        int[] res = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            res[i] = Integer.parseInt(parts[i].trim());
        }
        return res;
    }

    public static long[] parseLongArray(String s) {
        s = s.trim().replaceAll("^\\\\[|]$", "");
        if (s.isEmpty()) return new long[0];
        String[] parts = s.split(",");
        long[] res = new long[parts.length];
        for (int i = 0; i < parts.length; i++) {
            res[i] = Long.parseLong(parts[i].trim());
        }
        return res;
    }

    public static double[] parseDoubleArray(String s) {
        s = s.trim().replaceAll("^\\\\[|]$", "");
        if (s.isEmpty()) return new double[0];
        String[] parts = s.split(",");
        double[] res = new double[parts.length];
        for (int i = 0; i < parts.length; i++) {
            res[i] = Double.parseDouble(parts[i].trim());
        }
        return res;
    }

    public static boolean[] parseBooleanArray(String s) {
        s = s.trim().replaceAll("^\\\\[|]$", "");
        if (s.isEmpty()) return new boolean[0];
        String[] parts = s.split(",");
        boolean[] res = new boolean[parts.length];
        for (int i = 0; i < parts.length; i++) {
            res[i] = Boolean.parseBoolean(parts[i].trim());
        }
        return res;
    }

    public static String[] parseStringArray(String s) {
        s = s.trim().replaceAll("^\\\\[|]$", "");
        if (s.isEmpty()) return new String[0];
        String[] parts = s.split(",");
        String[] res = new String[parts.length];
        for (int i = 0; i < parts.length; i++) {
            res[i] = parts[i].trim().replaceAll("^\\"|\\"$", "");
        }
        return res;
    }

    public static int[][] parseInt2DArray(String s) {
        s = s.trim();
        if (s.startsWith("[")) {
            s = s.substring(1);
        }
        if (s.endsWith("]")) {
            s = s.substring(0, s.length() - 1);
        }
        List<int[]> list = new ArrayList<>();
        int i = 0;
        while (i < s.length()) {
            if (s.charAt(i) == '[') {
                int start = i + 1;
                while (i < s.length() && s.charAt(i) != ']') i++;
                list.add(parseIntArray(s.substring(start, i)));
            }
            i++;
        }
        return list.toArray(new int[0][]);
    }

    public static ListNode parseListNode(String s) {
        s = s.trim();
        if (s.isEmpty() || s.equals("null")) return null;
        String[] parts = s.split("->");
        ListNode dummy = new ListNode(0);
        ListNode curr = dummy;
        for (String p : parts) {
            curr.next = new ListNode(Integer.parseInt(p.trim()));
            curr = curr.next;
        }
        return dummy.next;
    }

    public static TreeNode parseTreeNode(String s) {
        s = s.trim().replaceAll("^\\\\[|]$", "");
        if (s.isEmpty() || s.equals("null")) return null;
        String[] parts = s.split(",");
        if (parts.length == 0 || parts[0].trim().equals("null")) return null;

        TreeNode root = new TreeNode(Integer.parseInt(parts[0].trim()));
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        int i = 1;
        while (!q.isEmpty() && i < parts.length) {
            TreeNode curr = q.poll();
            if (i < parts.length) {
                String val = parts[i].trim();
                if (!val.equals("null") && !val.isEmpty()) {
                    curr.left = new TreeNode(Integer.parseInt(val));
                    q.add(curr.left);
                }
                i++;
            }
            if (i < parts.length) {
                String val = parts[i].trim();
                if (!val.equals("null") && !val.isEmpty()) {
                    curr.right = new TreeNode(Integer.parseInt(val));
                    q.add(curr.right);
                }
                i++;
            }
        }
        return root;
    }

    // Output Serializers
    public static String serialize(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof int[]) {
            return Arrays.toString((int[]) obj).replace(" ", "");
        }
        if (obj instanceof long[]) {
            return Arrays.toString((long[]) obj).replace(" ", "");
        }
        if (obj instanceof double[]) {
            return Arrays.toString((double[]) obj).replace(" ", "");
        }
        if (obj instanceof boolean[]) {
            return Arrays.toString((boolean[]) obj).replace(" ", "");
        }
        if (obj instanceof Object[]) {
            return Arrays.deepToString((Object[]) obj).replace(" ", "");
        }
        if (obj instanceof List) {
            return obj.toString().replace(" ", "");
        }
        return String.valueOf(obj);
    }

    public static String serializeListNode(ListNode head) {
        if (head == null) return "null";
        StringBuilder sb = new StringBuilder();
        ListNode curr = head;
        while (curr != null) {
            sb.append(curr.val);
            curr = curr.next;
            if (curr != null) sb.append("->");
        }
        return sb.toString();
    }

    public static String serializeTreeNode(TreeNode root) {
        if (root == null) return "[]";
        StringBuilder sb = new StringBuilder("[");
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        List<String> list = new ArrayList<>();
        while (!q.isEmpty()) {
            TreeNode curr = q.poll();
            if (curr == null) {
                list.add("null");
            } else {
                list.add(String.valueOf(curr.val));
                q.add(curr.left);
                q.add(curr.right);
            }
        }
        while (!list.isEmpty() && list.get(list.size() - 1).equals("null")) {
            list.remove(list.size() - 1);
        }
        for (int i = 0; i < list.size(); i++) {
            sb.append(list.get(i));
            if (i < list.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    public static void main(String[] args) {
        ${signature.className} sol = new ${signature.className}();
${argParsingCode}
${outputSerialization}
    }
}
  `;
}

function writeJavaHelpers(runDir: string) {
  const listNode = `
public class ListNode {
    public int val;
    public ListNode next;
    public ListNode() {}
    public ListNode(int val) { this.val = val; }
    public ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}
  `.trim();

  const treeNode = `
public class TreeNode {
    public int val;
    public TreeNode left;
    public TreeNode right;
    public TreeNode() {}
    public TreeNode(int val) { this.val = val; }
    public TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}
  `.trim();

  fs.writeFileSync(path.join(runDir, 'ListNode.java'), listNode);
  fs.writeFileSync(path.join(runDir, 'TreeNode.java'), treeNode);
}


// -------------------------------------------------------------
// C++ Signature Parser & Runner Generator
// -------------------------------------------------------------
interface CppSignature {
  className: string;
  methodName: string;
  returnType: string;
  params: { type: string; name: string }[];
}

function parseCppSignature(code: string): CppSignature | null {
  const cleanCode = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');

  const classMatch = cleanCode.match(/class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : 'Solution';

  const methodRegex = /(?:public\s*:\s*)?(vector\s*<[^>]+>|[\w:<>&*]+)\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
  let match;
  while ((match = methodRegex.exec(cleanCode)) !== null) {
    const returnType = match[1].trim();
    const methodName = match[2].trim();
    const paramsStr = match[3];

    if (methodName === className || methodName === 'main' || returnType.includes('class')) {
      continue;
    }

    const params = paramsStr.trim() === '' ? [] : paramsStr.split(',').map(p => {
      const parts = p.trim().split(/\s+/);
      const name = parts.pop() || '';
      const isPointer = name.includes('*') || parts.some(part => part.includes('*'));
      const cleanName = name.replace(/^[&*]+/, '');
      let type = parts.join(' ');
      if (isPointer && !type.includes('*')) {
        type += '*';
      }
      return { type, name: cleanName };
    });

    return { className, methodName, returnType, params };
  }
  return null;
}

function generateCppRunner(signature: CppSignature, inputStr: string): string {
  const parts = inputStr.split('\n');
  let argParsingCode = '';
  let invocationArgs: string[] = [];

  signature.params.forEach((param, index) => {
    const rawVal = parts[index] ? parts[index].trim() : '';
    const argName = `arg${index}`;
    invocationArgs.push(argName);

    const type = param.type.replace(/\s+/g, '');
    if (type.startsWith('vector<vector<int>>')) {
      argParsingCode += `    vector<vector<int>> ${argName} = parse2DIntVector(${JSON.stringify(rawVal)}); \n`;
    } else if (type.startsWith('vector<int>')) {
      argParsingCode += `    vector<int> ${argName} = parseIntVector(${JSON.stringify(rawVal)}); \n`;
    } else if (type.startsWith('vector<string>')) {
      argParsingCode += `    vector<string> ${argName} = parseStringVector(${JSON.stringify(rawVal)}); \n`;
    } else if (type === 'int') {
      argParsingCode += `    int ${argName} = stoi(${JSON.stringify(rawVal)}); \n`;
    } else if (type === 'long' || type === 'longlong') {
      argParsingCode += `    long long ${argName} = stoll(${JSON.stringify(rawVal)}); \n`;
    } else if (type === 'double') {
      argParsingCode += `    double ${argName} = stod(${JSON.stringify(rawVal)}); \n`;
    } else if (type === 'float') {
      argParsingCode += `    float ${argName} = stof(${JSON.stringify(rawVal)}); \n`;
    } else if (type === 'bool') {
      argParsingCode += `    bool ${argName} = (${JSON.stringify(rawVal)} == "true"); \n`;
    } else if (type === 'string') {
      argParsingCode += `    string ${argName} = ${JSON.stringify(rawVal)}; \n`;
      argParsingCode += `    if (${argName}.front() == '"' && ${argName}.back() == '"') ${argName} = ${argName}.substr(1, ${argName}.length() - 2); \n`;
    } else if (type === 'ListNode*') {
      argParsingCode += `    ListNode* ${argName} = parseListNode(${JSON.stringify(rawVal)}); \n`;
    } else if (type === 'TreeNode*') {
      argParsingCode += `    TreeNode* ${argName} = parseTreeNode(${JSON.stringify(rawVal)}); \n`;
    } else {
      argParsingCode += `    string ${argName} = ${JSON.stringify(rawVal)}; \n`;
    }
  });

  let outputSerialization = '';
  const retType = signature.returnType.replace(/\s+/g, '');
  if (retType === 'void') {
    outputSerialization = `
    sol.${signature.methodName}(${invocationArgs.join(', ')});
    cout << "void" << endl;
    `;
  } else if (retType === 'ListNode*') {
    outputSerialization = `
    ListNode* res = sol.${signature.methodName}(${invocationArgs.join(', ')});
    printListNode(res);
    `;
  } else if (retType === 'TreeNode*') {
    outputSerialization = `
    TreeNode* res = sol.${signature.methodName}(${invocationArgs.join(', ')});
    printTreeNode(res);
    `;
  } else if (retType.startsWith('vector<vector<int>>')) {
    outputSerialization = `
    auto res = sol.${signature.methodName}(${invocationArgs.join(', ')});
    print2DIntVector(res);
    `;
  } else if (retType.startsWith('vector<int>')) {
    outputSerialization = `
    auto res = sol.${signature.methodName}(${invocationArgs.join(', ')});
    printIntVector(res);
    `;
  } else if (retType.startsWith('vector<string>')) {
    outputSerialization = `
    auto res = sol.${signature.methodName}(${invocationArgs.join(', ')});
    printStringVector(res);
    `;
  } else if (retType === 'bool') {
    outputSerialization = `
    auto res = sol.${signature.methodName}(${invocationArgs.join(', ')});
    cout << (res ? "true" : "false") << endl;
    `;
  } else {
    outputSerialization = `
    auto res = sol.${signature.methodName}(${invocationArgs.join(', ')});
    cout << res << endl;
    `;
  }

  return `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <queue>
#include <algorithm>
#include "Solution.cpp"

using namespace std;

// ListNode/TreeNode declarations
#ifndef STRUCTS_H
#define STRUCTS_H
struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(NULL) {}
};

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode(int x) : val(x), left(NULL), right(NULL) {}
};
#endif

// Parsing Helpers
vector<int> parseIntVector(string s) {
    if (s.front() == '[') s = s.substr(1);
    if (s.back() == ']') s = s.substr(0, s.length() - 1);
    vector<int> res;
    stringstream ss(s);
    string token;
    while (getline(ss, token, ',')) {
        if (!token.empty()) res.push_back(stoi(token));
    }
    return res;
}

vector<string> parseStringVector(string s) {
    if (s.front() == '[') s = s.substr(1);
    if (s.back() == ']') s = s.substr(0, s.length() - 1);
    vector<string> res;
    stringstream ss(s);
    string token;
    while (getline(ss, token, ',')) {
        if (!token.empty()) {
            if (token.front() == '"') token = token.substr(1);
            if (token.back() == '"') token = token.substr(0, token.length() - 1);
            res.push_back(token);
        }
    }
    return res;
}

vector<vector<int>> parse2DIntVector(string s) {
    if (s.front() == '[') s = s.substr(1);
    if (s.back() == ']') s = s.substr(0, s.length() - 1);
    vector<vector<int>> res;
    int i = 0;
    while (i < s.length()) {
        if (s[i] == '[') {
            int start = i + 1;
            while (i < s.length() && s[i] != ']') i++;
            res.push_back(parseIntVector(s.substr(start, i - start)));
        }
        i++;
    }
    return res;
}

ListNode* parseListNode(string s) {
    if (s.empty() || s == "null") return NULL;
    stringstream ss(s);
    string token;
    ListNode* dummy = new ListNode(0);
    ListNode* curr = dummy;
    while (getline(ss, token, '-')) {
        if (token.front() == '>') token = token.substr(1);
        if (!token.empty()) {
            curr->next = new ListNode(stoi(token));
            curr = curr->next;
        }
    }
    return dummy->next;
}

TreeNode* parseTreeNode(string s) {
    if (s.front() == '[') s = s.substr(1);
    if (s.back() == ']') s = s.substr(0, s.length() - 1);
    if (s.empty() || s == "null") return NULL;
    
    vector<string> parts;
    stringstream ss(s);
    string token;
    while (getline(ss, token, ',')) {
        parts.push_back(token);
    }
    
    if (parts.empty() || parts[0] == "null" || parts[0].empty()) return NULL;
    
    TreeNode* root = new TreeNode(stoi(parts[0]));
    queue<TreeNode*> q;
    q.push(root);
    int i = 1;
    while (!q.empty() && i < parts.size()) {
        TreeNode* curr = q.front();
        q.pop();
        if (i < parts.size()) {
            string val = parts[i];
            if (val != "null" && !val.empty()) {
                curr->left = new TreeNode(stoi(val));
                q.push(curr->left);
            }
            i++;
        }
        if (i < parts.size()) {
            string val = parts[i];
            if (val != "null" && !val.empty()) {
                curr->right = new TreeNode(stoi(val));
                q.push(curr->right);
            }
            i++;
        }
    }
    return root;
}

// Serialization Helpers
void printIntVector(const vector<int>& v) {
    cout << "[";
    for (int i = 0; i < v.size(); ++i) {
        cout << v[i];
        if (i < v.size() - 1) cout << ",";
    }
    cout << "]" << endl;
}

void printStringVector(const vector<string>& v) {
    cout << "[";
    for (int i = 0; i < v.size(); ++i) {
        cout << "\\\"" << v[i] << "\\\"";
        if (i < v.size() - 1) cout << ",";
    }
    cout << "]" << endl;
}

void print2DIntVector(const vector<vector<int>>& v) {
    cout << "[";
    for (int i = 0; i < v.size(); ++i) {
        cout << "[";
        for (int j = 0; j < v[i].size(); ++j) {
            cout << v[i][j];
            if (j < v[i].size() - 1) cout << ",";
        }
        cout << "]";
        if (i < v.size() - 1) cout << ",";
    }
    cout << "]" << endl;
}

void printListNode(ListNode* head) {
    if (!head) {
        cout << "null" << endl;
        return;
    }
    ListNode* curr = head;
    while (curr) {
        cout << curr->val;
        curr = curr->next;
        if (curr) cout << "->";
    }
    cout << endl;
}

void printTreeNode(TreeNode* root) {
    if (!root) {
        cout << "[]" << endl;
        return;
    }
    vector<string> list;
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        TreeNode* curr = q.front();
        q.pop();
        if (!curr) {
            list.push_back("null");
        } else {
            list.push_back(to_string(curr->val));
            q.push(curr->left);
            q.push(curr->right);
        }
    }
    while (!list.empty() && list.back() == "null") {
        list.pop_back();
    }
    cout << "[";
    for (int i = 0; i < list.size(); ++i) {
        cout << list[i];
        if (i < list.size() - 1) cout << ",";
    }
    cout << "]" << endl;
}

int main() {
    Solution sol;
${argParsingCode}
${outputSerialization}
    return 0;
}
  `;
}


// -------------------------------------------------------------
// C Signature Parser & Runner Generator
// -------------------------------------------------------------
interface CSignature {
  methodName: string;
  returnType: string;
  params: { type: string; name: string }[];
}

function parseCSignature(code: string): CSignature | null {
  const cleanCode = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');

  const methodRegex = /([\w*]+)\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
  let match;
  while ((match = methodRegex.exec(cleanCode)) !== null) {
    const returnType = match[1].trim();
    const methodName = match[2].trim();
    const paramsStr = match[3];

    if (methodName === 'main' || returnType.includes('struct') || returnType.includes('class')) {
      continue;
    }

    const params = paramsStr.trim() === '' ? [] : paramsStr.split(',').map(p => {
      const parts = p.trim().split(/\s+/);
      const name = parts.pop() || '';
      const isPointer = name.includes('*') || parts.some(part => part.includes('*'));
      const cleanName = name.replace(/^[&*]+/, '');
      let type = parts.join(' ');
      if (isPointer && !type.includes('*')) {
        type += '*';
      }
      return { type, name: cleanName };
    });

    return { methodName, returnType, params };
  }
  return null;
}

function generateCRunner(signature: CSignature, inputStr: string): string {
  const parts = inputStr.split('\n');
  let argParsingCode = '';
  let invocationArgs: string[] = [];
  let inputIndex = 0;

  signature.params.forEach((param, index) => {
    const argName = `arg${index}`;
    invocationArgs.push(argName);

    const type = param.type.replace(/\s+/g, '');
    const isReturnSize = type === 'int*returnSize' || (type === 'int*' && param.name.toLowerCase().includes('return'));
    const isArraySize = type === 'int' && param.name.toLowerCase().includes('size') && index > 0 && signature.params[index-1].type.replace(/\s+/g, '') === 'int*';

    if (isReturnSize) {
      argParsingCode += `    int ${argName}_val = 0; int* ${argName} = &${argName}_val; \n`;
    } else if (isArraySize) {
      argParsingCode += `    int ${argName} = arg${index-1}_size; \n`;
    } else {
      const rawVal = parts[inputIndex] ? parts[inputIndex].trim() : '';
      inputIndex++;

      if (type === 'int*') {
        argParsingCode += `
    int ${argName}_size = 0;
    int* ${argName} = parseIntArray(${JSON.stringify(rawVal)}, &${argName}_size);
        `;
      } else if (type === 'int') {
        argParsingCode += `    int ${argName} = atoi(${JSON.stringify(rawVal)}); \n`;
      } else if (type === 'double') {
        argParsingCode += `    double ${argName} = atof(${JSON.stringify(rawVal)}); \n`;
      } else if (type === 'char*') {
        argParsingCode += `    char* ${argName} = ${JSON.stringify(rawVal)}; \n`;
      } else if (type === 'ListNode*') {
        argParsingCode += `    struct ListNode* ${argName} = parseListNode(${JSON.stringify(rawVal)}); \n`;
      } else {
        argParsingCode += `    char* ${argName} = ${JSON.stringify(rawVal)}; \n`;
      }
    }
  });

  let outputSerialization = '';
  const retType = signature.returnType.replace(/\s+/g, '');
  if (retType === 'int*') {
    const retSizeIdx = signature.params.findIndex(p => p.type.replace(/\s+/g, '') === 'int*' && p.name.toLowerCase().includes('return'));
    outputSerialization = `
    int* res = ${signature.methodName}(${invocationArgs.join(', ')});
    int out_size = ${retSizeIdx !== -1 ? `arg${retSizeIdx}_val` : '2'};
    printIntArray(res, out_size);
    `;
  } else if (retType === 'ListNode*') {
    outputSerialization = `
    struct ListNode* res = ${signature.methodName}(${invocationArgs.join(', ')});
    printListNode(res);
    `;
  } else if (retType === 'int') {
    outputSerialization = `
    int res = ${signature.methodName}(${invocationArgs.join(', ')});
    printf("%d\\n", res);
    `;
  } else {
    outputSerialization = `
    printf("%s\\n", ${signature.methodName}(${invocationArgs.join(', ')}));
    `;
  }

  return `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// ListNode definition
#ifndef STRUCTS_H
#define STRUCTS_H
struct ListNode {
    int val;
    struct ListNode *next;
};
#endif

// Prototype
extern ${signature.returnType} ${signature.methodName}(${signature.params.map(p => p.type + ' ' + p.name).join(', ')});

// Parser Helpers
int* parseIntArray(const char* s, int* out_size) {
    if (s[0] == '[') s++;
    char* copy = strdup(s);
    if (copy[strlen(copy)-1] == ']') copy[strlen(copy)-1] = '\\0';
    
    int capacity = 10;
    int* res = malloc(capacity * sizeof(int));
    int count = 0;
    
    char* token = strtok(copy, ",");
    while (token != NULL) {
        if (count >= capacity) {
            capacity *= 2;
            res = realloc(res, capacity * sizeof(int));
        }
        res[count++] = atoi(token);
        token = strtok(NULL, ",");
    }
    free(copy);
    *out_size = count;
    return res;
}

struct ListNode* parseListNode(const char* s) {
    if (!s || strcmp(s, "null") == 0 || strlen(s) == 0) return NULL;
    char* copy = strdup(s);
    
    struct ListNode* dummy = malloc(sizeof(struct ListNode));
    dummy->val = 0;
    dummy->next = NULL;
    struct ListNode* curr = dummy;
    
    char* token = strtok(copy, "->");
    while (token != NULL) {
        struct ListNode* node = malloc(sizeof(struct ListNode));
        node->val = atoi(token);
        node->next = NULL;
        curr->next = node;
        curr = curr->next;
        token = strtok(NULL, "->");
    }
    free(copy);
    struct ListNode* head = dummy->next;
    free(dummy);
    return head;
}

void printIntArray(int* arr, int size) {
    if (!arr) {
        printf("[]\\n");
        return;
    }
    printf("[");
    for (int i = 0; i < size; ++i) {
        printf("%d", arr[i]);
        if (i < size - 1) printf(",");
    }
    printf("]\\n");
}

void printListNode(struct ListNode* head) {
    if (!head) {
        printf("null\\n");
        return;
    }
    struct ListNode* curr = head;
    while (curr) {
        printf("%d", curr->val);
        curr = curr->next;
        if (curr) printf("->");
    }
    printf("\\n");
}

int main() {
${argParsingCode}
${outputSerialization}
    return 0;
}
  `;
}


// -------------------------------------------------------------
// Python Generic Runner Template Generator
// -------------------------------------------------------------
function generatePythonRunner(cleanInput: string): string {
  return `
import sys
import json

# Define custom types
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# Helper parsers
def parse_list_node(s):
    s = s.strip()
    if not s or s == "null": return None
    parts = s.split("->")
    dummy = ListNode(0)
    curr = dummy
    for p in parts:
        curr.next = ListNode(int(p.strip()))
        curr = curr.next
    return dummy.next

def parse_tree_node(s):
    s = s.strip().strip("[]")
    if not s or s == "null": return None
    parts = [p.strip() for p in s.split(",")]
    if not parts or parts[0] == "null" or not parts[0]: return None
    
    root = TreeNode(int(parts[0]))
    q = [root]
    i = 1
    while q and i < len(parts):
        curr = q.pop(0)
        if i < len(parts):
            val = parts[i]
            if val != "null" and val:
                curr.left = TreeNode(int(val))
                q.append(curr.left)
            i += 1
        if i < len(parts):
            val = parts[i]
            if val != "null" and val:
                curr.right = TreeNode(int(val))
                q.append(curr.right)
            i += 1
    return root

def serialize_list_node(head):
    if not head: return "null"
    res = []
    curr = head
    while curr:
        res.append(str(curr.val))
        curr = curr.next
    return "->".join(res)

def serialize_tree_node(root):
    if not root: return "[]"
    res = []
    q = [root]
    while q:
        curr = q.pop(0)
        if not curr:
            res.append("null")
        else:
            res.append(str(curr.val))
            q.append(curr.left)
            q.append(curr.right)
    while res and res[-1] == "null":
        res.pop()
    return "[" + ",".join(res) + "]"

def parse_arg(arg):
    arg = arg.strip()
    if '->' in arg:
        return parse_list_node(arg)
    if arg.startswith('[') and arg.endswith(']'):
        if 'null' in arg or (len(arg) > 2 and ',' in arg and not arg.replace('[','').replace(']','').replace(',','').replace(' ','').replace('-','').replace('null','').isdigit()):
            return parse_tree_node(arg)
        return json.loads(arg)
    if ',' in arg:
        parts = arg.split(',')
        try:
            return [int(p.strip()) for p in parts]
        except ValueError:
            try:
                return [float(p.strip()) for p in parts]
            except ValueError:
                return [p.strip().strip('"') for p in parts]
    if arg.lower() == 'true': return True
    if arg.lower() == 'false': return False
    if arg.isdigit() or (arg.startswith('-') and arg[1:].isdigit()): return int(arg)
    try:
        return float(arg)
    except ValueError:
        return arg.strip('"')

try:
    import Solution
    
    sol = None
    method = None
    
    if hasattr(Solution, 'Solution'):
        sol = Solution.Solution()
        methods = [m for m in dir(sol) if not m.startswith('_') and callable(getattr(sol, m))]
        if methods:
            method = getattr(sol, methods[0])
    elif hasattr(Solution, 'solve'):
        method = Solution.solve
    else:
        funcs = [f for f in dir(Solution) if not f.startswith('_') and callable(getattr(Solution, f))]
        if funcs:
            method = getattr(Solution, funcs[0])
            
    if method is None:
        raise Exception("No callable solver found")
        
    input_str = """${cleanInput}"""
    args = [line.strip() for line in input_str.split('\\n') if line.strip()]
    parsed_args = [parse_arg(arg) for arg in args]
    
    if sol is not None:
        res = method(*parsed_args)
    else:
        res = method(*parsed_args)
    
    if isinstance(res, ListNode):
        print(serialize_list_node(res))
    elif isinstance(res, TreeNode):
        print(serialize_tree_node(res))
    elif isinstance(res, bool):
        print(str(res).lower())
    elif isinstance(res, (list, dict)):
        print(json.dumps(res).replace(" ", ""))
    else:
        print(res)
except Exception as e:
    print("__FALLBACK__")
    print(str(e))
  `.trim();
}


// -------------------------------------------------------------
// JavaScript / TypeScript Generic Runner Template Generator
// -------------------------------------------------------------
function generateJsRunner(cleanInput: string): string {
  return `
const fs = require('fs');

class ListNode {
    constructor(val = 0, next = null) {
        this.val = val;
        this.next = next;
    }
}
class TreeNode {
    constructor(val = 0, left = null, right = null) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}
function parseListNode(s) {
    s = s.trim();
    if (!s || s === 'null') return null;
    const parts = s.split('->');
    const dummy = new ListNode(0);
    let curr = dummy;
    for (const p of parts) {
        curr.next = new ListNode(parseInt(p.trim()));
        curr = curr.next;
    }
    return dummy.next;
}
function parseTreeNode(s) {
    s = s.trim().replace(/^\\\[|\\\]$/g, '');
    if (!s || s === 'null') return null;
    const parts = s.split(',').map(p => p.trim());
    if (parts.length === 0 || parts[0] === 'null' || parts[0] === '') return null;
    const root = new TreeNode(parseInt(parts[0]));
    const q = [root];
    let i = 1;
    while (q.length > 0 && i < parts.length) {
        const curr = q.shift();
        if (i < parts.length) {
            const val = parts[i];
            if (val !== 'null' && val !== '') {
                curr.left = new TreeNode(parseInt(val));
                q.push(curr.left);
            }
            i++;
        }
        if (i < parts.length) {
            const val = parts[i];
            if (val !== 'null' && val !== '') {
                curr.right = new TreeNode(parseInt(val));
                q.push(curr.right);
            }
            i++;
        }
    }
    return root;
}
function serializeListNode(head) {
    if (!head) return 'null';
    const res = [];
    let curr = head;
    while (curr) {
        res.push(curr.val);
        curr = curr.next;
    }
    return res.join('->');
}
function serializeTreeNode(root) {
    if (!root) return '[]';
    const res = [];
    const q = [root];
    while (q.length > 0) {
        const curr = q.shift();
        if (!curr) {
            res.push('null');
        } else {
            res.push(curr.val.toString());
            q.push(curr.left);
            q.push(curr.right);
        }
    }
    while (res.length > 0 && res[res.length - 1] === 'null') {
        res.pop();
    }
    return '[' + res.join(',') + ']';
}

function parseArg(arg) {
    arg = arg.trim();
    if (arg.includes('->')) return parseListNode(arg);
    if (arg.startsWith('[') && arg.endswith(']')) {
        if (arg.includes('null') || (arg.includes(',') && !arg.replace(/[\\\[\\\]\\s,-]|null/g, '').match(/^\\d+$/))) {
            return parseTreeNode(arg);
        }
        return JSON.parse(arg);
    }
    if (arg.includes(',')) {
        const parts = arg.split(',').map(p => p.trim());
        if (parts.every(p => !isNaN(p) && p !== '')) {
            return parts.map(Number);
        }
        return parts.map(p => p.replace(/^"|"$/g, ''));
    }
    if (arg.toLowerCase() === 'true') return true;
    if (arg.toLowerCase() === 'false') return false;
    if (!isNaN(arg) && arg !== '') return Number(arg);
    return arg.replace(/^"|"$/g, '');
}

try {
    const mod = require('./Solution');
    const Solution = mod.Solution || mod.default || (typeof mod === 'function' && mod.name === 'Solution' ? mod : null);
    const solve = mod.solve || (typeof mod === 'function' && mod.name === 'solve' ? mod : null);
    
    const inputStr = ${JSON.stringify(cleanInput)};
    const args = inputStr.split('\\n').map(l => l.trim()).filter(Boolean);
    const parsedArgs = args.map(parseArg);

    let res;
    if (Solution) {
        const sol = new Solution();
        const proto = Object.getPrototypeOf(sol);
        const methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof sol[m] === 'function');
        if (methods.length > 0) {
            res = sol[methods[0]](...parsedArgs);
        } else {
            throw new Error("No method found on Solution class");
        }
    } else if (solve) {
        res = solve(...parsedArgs);
    } else if (typeof mod === 'function') {
        const inst = new mod();
        const proto = Object.getPrototypeOf(inst);
        const methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof inst[m] === 'function');
        if (methods.length > 0) {
            res = inst[methods[0]](...parsedArgs);
        } else {
            res = mod(...parsedArgs);
        }
    } else {
        throw new Error("No Solution class or solve function found");
    }
    
    if (res instanceof ListNode) {
        console.log(serializeListNode(res));
    } else if (res instanceof TreeNode) {
        console.log(serializeTreeNode(res));
    } else if (typeof res === 'boolean') {
        console.log(res.toString());
    } else if (Array.isArray(res) || typeof res === 'object') {
        console.log(JSON.stringify(res).replace(/\\s/g, ''));
    } else {
        console.log(res);
    }
} catch (e) {
    console.log("__FALLBACK__");
    console.log(e.message);
}
  `.trim();
}


export class LocalJudgeProvider implements JudgeProvider {
  async execute(code: string, languageCode: string, input: string): Promise<ExecutionResult> {
    logger.info(`LocalJudge: Executing code for ${languageCode}`);
    
    const tempDir = path.join(process.cwd(), 'temp_runs');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const runId = crypto.randomUUID();
    const runDir = path.join(tempDir, `run_${runId}`);
    fs.mkdirSync(runDir, { recursive: true });

    const cleanInput = input.trim();
    const start = Date.now();

    try {
      let runResult: any;
      let output = '';
      let lang = languageCode ? languageCode.toLowerCase() : '';

      // HEURISTIC AUTO-DETECTION to prevent incorrect routing (e.g. running Java code with Node.js)
      let detectedHeuristic = '';
      if (code.includes('import java.') || code.includes('public class ') || code.includes('System.out.print') || (code.includes('class Solution') && code.includes('public int[]'))) {
        detectedHeuristic = 'java';
      } else if (code.includes('#include') && (code.includes('std::') || code.includes('cout') || code.includes('vector<') || code.includes('using namespace std'))) {
        detectedHeuristic = 'cpp';
      } else if (code.includes('#include <stdio.h>') || code.includes('printf(') || code.includes('malloc(')) {
        if (!code.includes('cout') && !code.includes('using namespace std')) {
          detectedHeuristic = 'c';
        }
      } else if ((code.includes('def ') && code.includes(':')) || code.includes('import sys') || (code.includes('print(') && !code.includes('console.log') && !code.includes('public class') && !code.includes('function '))) {
        detectedHeuristic = 'python';
      } else if (code.includes('console.log') || code.includes('let ') || code.includes('const ') || code.includes('function ')) {
        if (code.includes(': number') || code.includes(': string') || code.includes(': any')) {
          detectedHeuristic = 'typescript';
        } else {
          detectedHeuristic = 'javascript';
        }
      }

      if (detectedHeuristic) {
        lang = detectedHeuristic;
      } else if (!lang) {
        lang = 'javascript';
      }

      const checkCommand = (cmd: string): boolean => {
        try {
          const checkCmd = process.platform === 'win32' ? `${cmd}.exe` : cmd;
          const res = spawnSync(checkCmd, ['--version'], { timeout: 1000 });
          if (res.error && (res.error as any).code === 'ENOENT') {
            return false;
          }
          return true;
        } catch (e) {
          return false;
        }
      };

      // -------------------------------------------------------------
      // JAVASCRIPT / TYPESCRIPT IMPLEMENTATION
      // -------------------------------------------------------------
      if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
        if (!checkCommand('node')) {
          return {
            status: 'COMPILE_ERROR',
            stderr: 'Compiler not installed: Node.js runtime is not installed on this machine.',
            success: false,
            language: lang,
            error: 'Compiler not installed.',
            runtime: 0,
            memory: 0,
          };
        }

        const isTs = lang === 'typescript' || lang === 'ts';
        const tsxPath = path.join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');
        if (isTs && !fs.existsSync(tsxPath)) {
          return {
            status: 'COMPILE_ERROR',
            stderr: 'Compiler not installed: TypeScript compiler (tsx) is not installed in project node_modules.',
            success: false,
            language: lang,
            error: 'Compiler not installed.',
            runtime: 0,
            memory: 0,
          };
        }

        const solFile = isTs ? 'Solution.ts' : 'Solution.js';
        const exportCode = `
\n
if (typeof Solution !== 'undefined') module.exports.Solution = Solution;
if (typeof solve !== 'undefined') module.exports.solve = solve;
        `;
        fs.writeFileSync(path.join(runDir, solFile), code + exportCode);

        const runnerContent = generateJsRunner(cleanInput);
        const runnerFile = isTs ? 'runner.ts' : 'runner.js';
        fs.writeFileSync(path.join(runDir, runnerFile), runnerContent);

        // Run
        if (isTs) {
          runResult = spawnSync('node', [tsxPath, 'runner.ts'], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
        } else {
          runResult = spawnSync('node', ['runner.js'], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
        }

        if (runResult.stdout && runResult.stdout.includes('__FALLBACK__')) {
          logger.info("JS/TS generic runner failed to find Solution class or solve. Falling back to old print-based method.");
          const scriptContent = `
            const inputStr = ${JSON.stringify(cleanInput)};
            const result = (function() {
              ${code}
            })();
            if (result !== undefined) {
              console.log(typeof result === 'object' ? JSON.stringify(result) : result);
            }
          `;
          fs.writeFileSync(path.join(runDir, 'fallback.js'), scriptContent);
          runResult = spawnSync('node', ['fallback.js'], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
        }
      } 
      // -------------------------------------------------------------
      // PYTHON IMPLEMENTATION
      // -------------------------------------------------------------
      else if (lang === 'python' || lang === 'py') {
        const command = process.platform === 'win32' ? 'python' : 'python3';
        if (!checkCommand(command) && !checkCommand('python')) {
          return {
            status: 'COMPILE_ERROR',
            stderr: 'Compiler not installed: Python 3 runtime is not installed on this machine.',
            success: false,
            language: lang,
            error: 'Compiler not installed.',
            runtime: 0,
            memory: 0,
          };
        }

        fs.writeFileSync(path.join(runDir, 'Solution.py'), code);

        const runnerContent = generatePythonRunner(cleanInput);
        fs.writeFileSync(path.join(runDir, 'runner.py'), runnerContent);

        runResult = spawnSync(command, ['runner.py'], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
        if (runResult.error && (runResult.error as any).code === 'ENOENT' && command === 'python3') {
          runResult = spawnSync('python', ['runner.py'], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
        }

        if (runResult.stdout && runResult.stdout.includes('__FALLBACK__')) {
          logger.info("Python generic runner failed to find Solution class. Falling back to old print-based method.");
          const scriptContent = `
import sys
import json
input_str = ${JSON.stringify(cleanInput)}
${code}
          `;
          fs.writeFileSync(path.join(runDir, 'fallback.py'), scriptContent);
          runResult = spawnSync(command, ['fallback.py'], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
        }
      }
      // -------------------------------------------------------------
      // JAVA IMPLEMENTATION
      // -------------------------------------------------------------
      else if (lang === 'java') {
        if (!checkCommand('javac')) {
          return {
            status: 'COMPILE_ERROR',
            stderr: 'Compiler not installed: Java compiler (javac) is not installed on this machine.',
            success: false,
            language: lang,
            error: 'Compiler not installed.',
            runtime: 0,
            memory: 0,
          };
        }
        if (!checkCommand('java')) {
          return {
            status: 'COMPILE_ERROR',
            stderr: 'Compiler not installed: Java runtime (java) is not installed on this machine.',
            success: false,
            language: lang,
            error: 'Compiler not installed.',
            runtime: 0,
            memory: 0,
          };
        }

        const isMainStyle = code.includes('public static void main(');

        if (isMainStyle) {
          logger.info("Java: Detected public static void main method. Running in backward compatible mode.");
          const match = code.match(/class\s+(\w+)/);
          const className = match ? match[1] : 'Main';
          fs.writeFileSync(path.join(runDir, `${className}.java`), code);

          const compile = spawnSync('javac', [`${className}.java`], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
          if (compile.error || compile.status !== 0) {
            const compileErrMsg = compile.error ? compile.error.message : (compile.stderr || 'Compilation failed');
            return {
              status: 'COMPILE_ERROR',
              stderr: `Java compilation failed: ${compileErrMsg}`,
              runtime: 0,
              memory: 0,
            };
          }
          runResult = spawnSync('java', [className], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
        } else {
          logger.info("Java: No main method detected. Running in Generic LeetCode-style Runner mode.");
          const signature = parseJavaSignature(code);
          if (!signature) {
            return {
              status: 'COMPILE_ERROR',
              stderr: 'Compilation Error: Unable to parse any public methods inside your class Solution.',
              runtime: 0,
              memory: 0,
            };
          }

          writeJavaHelpers(runDir);
          fs.writeFileSync(path.join(runDir, `${signature.className}.java`), code);
          const runnerContent = generateJavaRunner(signature, cleanInput);
          fs.writeFileSync(path.join(runDir, 'Runner.java'), runnerContent);

          const compile = spawnSync('javac', ['ListNode.java', 'TreeNode.java', `${signature.className}.java`, 'Runner.java'], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
          if (compile.error || compile.status !== 0) {
            const compileErrMsg = compile.error ? compile.error.message : (compile.stderr || 'Compilation failed');
            return {
              status: 'COMPILE_ERROR',
              stderr: `Java compilation failed: ${compileErrMsg}`,
              runtime: 0,
              memory: 0,
            };
          }
          runResult = spawnSync('java', ['Runner'], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
        }
      }
      // -------------------------------------------------------------
      // C IMPLEMENTATION
      // -------------------------------------------------------------
      else if (lang === 'c') {
        if (!checkCommand('gcc')) {
          return {
            status: 'COMPILE_ERROR',
            stderr: 'Compiler not installed: C compiler (gcc) is not installed on this machine.',
            success: false,
            language: lang,
            error: 'Compiler not installed.',
            runtime: 0,
            memory: 0,
          };
        }

        const isMainStyle = code.includes('int main(') || code.includes('int main ()');

        if (isMainStyle) {
          logger.info("C: Detected main function. Running in backward compatible mode.");
          fs.writeFileSync(path.join(runDir, 'main.c'), code);
          const binaryName = process.platform === 'win32' ? 'main.exe' : 'main';
          const compile = spawnSync('gcc', ['main.c', '-o', binaryName], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
          if (compile.error || compile.status !== 0) {
            const compileErrMsg = compile.error ? compile.error.message : (compile.stderr || 'Compilation failed');
            return {
              status: 'COMPILE_ERROR',
              stderr: `C compilation failed: ${compileErrMsg}`,
              runtime: 0,
              memory: 0,
            };
          }
          const binaryPath = path.join(runDir, binaryName);
          runResult = spawnSync(binaryPath, [], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
        } else {
          logger.info("C: No main function detected. Running in Generic LeetCode-style Runner mode.");
          const signature = parseCSignature(code);
          if (!signature) {
            return {
              status: 'COMPILE_ERROR',
              stderr: 'Compilation Error: Unable to parse any solver function inside your C source code.',
              runtime: 0,
              memory: 0,
            };
          }

          fs.writeFileSync(path.join(runDir, 'Solution.c'), code);
          const runnerContent = generateCRunner(signature, cleanInput);
          fs.writeFileSync(path.join(runDir, 'runner.c'), runnerContent);

          const binaryName = process.platform === 'win32' ? 'main.exe' : 'main';
          const compile = spawnSync('gcc', ['Solution.c', 'runner.c', '-o', binaryName], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
          if (compile.error || compile.status !== 0) {
            const compileErrMsg = compile.error ? compile.error.message : (compile.stderr || 'Compilation failed');
            return {
              status: 'COMPILE_ERROR',
              stderr: `C compilation failed: ${compileErrMsg}`,
              runtime: 0,
              memory: 0,
            };
          }
          const binaryPath = path.join(runDir, binaryName);
          runResult = spawnSync(binaryPath, [], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
        }
      }
      // -------------------------------------------------------------
      // C++ IMPLEMENTATION
      // -------------------------------------------------------------
      else if (lang === 'cpp' || lang === 'c++') {
        if (!checkCommand('g++') && !checkCommand('gcc')) {
          return {
            status: 'COMPILE_ERROR',
            stderr: 'Compiler not installed: C++ compiler (g++) is not installed on this machine.',
            success: false,
            language: lang,
            error: 'Compiler not installed.',
            runtime: 0,
            memory: 0,
          };
        }

        const isMainStyle = code.includes('int main(') || code.includes('int main ()');

        if (isMainStyle) {
          logger.info("C++: Detected main function. Running in backward compatible mode.");
          fs.writeFileSync(path.join(runDir, 'main.cpp'), code);
          const binaryName = process.platform === 'win32' ? 'main.exe' : 'main';
          const compile = spawnSync('g++', ['main.cpp', '-o', binaryName], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
          if (compile.error || compile.status !== 0) {
            const compileErrMsg = compile.error ? compile.error.message : (compile.stderr || 'Compilation failed');
            return {
              status: 'COMPILE_ERROR',
              stderr: `C++ compilation failed: ${compileErrMsg}`,
              runtime: 0,
              memory: 0,
            };
          }
          const binaryPath = path.join(runDir, binaryName);
          runResult = spawnSync(binaryPath, [], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
        } else {
          logger.info("C++: No main function detected. Running in Generic LeetCode-style Runner mode.");
          const signature = parseCppSignature(code);
          if (!signature) {
            return {
              status: 'COMPILE_ERROR',
              stderr: 'Compilation Error: Unable to parse any class Solution solver method inside your C++ source code.',
              runtime: 0,
              memory: 0,
            };
          }

          fs.writeFileSync(path.join(runDir, 'Solution.cpp'), code);
          const runnerContent = generateCppRunner(signature, cleanInput);
          fs.writeFileSync(path.join(runDir, 'runner.cpp'), runnerContent);

          const binaryName = process.platform === 'win32' ? 'main.exe' : 'main';
          const compile = spawnSync('g++', ['runner.cpp', '-o', binaryName], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
          if (compile.error || compile.status !== 0) {
            const compileErrMsg = compile.error ? compile.error.message : (compile.stderr || 'Compilation failed');
            return {
              status: 'COMPILE_ERROR',
              stderr: `C++ compilation failed: ${compileErrMsg}`,
              runtime: 0,
              memory: 0,
            };
          }
          const binaryPath = path.join(runDir, binaryName);
          runResult = spawnSync(binaryPath, [], { cwd: runDir, timeout: 30000, encoding: 'utf-8' });
        }
      }
      else {
        return {
          status: 'COMPILE_ERROR',
          stderr: `Language '${languageCode}' not supported by local judge.`,
          runtime: 0,
          memory: 0,
        };
      }

      if (runResult.error) {
        logger.error(`Process run error: ${runResult.error.message}`, runResult.error);
        return {
          status: 'COMPILE_ERROR',
          stderr: `Execution error (Timeout/Spawn): ${runResult.error.message}\nExit Code: ${runResult.status}\nSignal: ${runResult.signal}\nSpawn Error: ${JSON.stringify(runResult.error)}`,
          runtime: Date.now() - start,
          memory: 0,
        };
      }

      if (runResult.status !== 0) {
        logger.error(`Process exited with non-zero code ${runResult.status}. Stderr: ${runResult.stderr}`);
        return {
          status: 'COMPILE_ERROR',
          stderr: runResult.stderr || `Execution failed with exit code: ${runResult.status}\nSignal: ${runResult.signal}`,
          runtime: Date.now() - start,
          memory: 100,
        };
      }

      output = runResult.stdout || '';
      return {
        status: 'PASSED',
        stdout: output,
        actualOutput: output.trim(),
        runtime: Date.now() - start,
        memory: 1024,
      };

    } catch (err: any) {
      return {
        status: 'COMPILE_ERROR',
        stderr: err.stderr ? err.stderr.toString() : err.message,
        runtime: 10,
        memory: 100,
      };
    } finally {
      try {
        fs.rmSync(runDir, { recursive: true, force: true });
      } catch (rmErr) {}
    }
  }

  async submit(code: string, languageCode: string, testCases: TestCaseItem[]): Promise<SubmissionResult> {
    logger.info(`LocalJudge: Grading submission with ${testCases.length} test cases`);
    const executions: SubmissionResult['executions'] = [];
    let passedCount = 0;

    for (const tc of testCases) {
      const exec = await this.execute(code, languageCode, tc.input);
      const isPassed = exec.status === 'PASSED' && exec.actualOutput === tc.expectedOutput.trim();

      if (isPassed) {
        passedCount++;
      }

      executions.push({
        testCaseId: tc.id,
        status: isPassed ? 'PASSED' : 'FAILED',
        runtime: exec.runtime || 0,
        memory: exec.memory || 0,
        stdout: exec.stdout,
        stderr: exec.stderr,
        actualOutput: exec.actualOutput,
      });
    }

    const hasCompileError = executions.some((e) => e.status === 'FAILED' && e.stderr);
    const scorePercentage = Math.round((passedCount / testCases.length) * 100);

    return {
      status: hasCompileError
        ? 'COMPILE_ERROR'
        : scorePercentage === 100
        ? 'ACCEPTED'
        : 'WRONG_ANSWER',
      score: scorePercentage,
      executionTime: executions.reduce((sum, e) => sum + e.runtime, 0),
      memoryUsage: Math.max(...executions.map((e) => e.memory)),
      executions,
    };
  }
}

export class JudgeService {
  private activeProvider: JudgeProvider;

  constructor() {
    this.activeProvider = new LocalJudgeProvider();
  }

  async execute(code: string, languageCode: string, input: string): Promise<ExecutionResult> {
    return this.activeProvider.execute(code, languageCode, input);
  }

  async submit(code: string, languageCode: string, testCases: TestCaseItem[]): Promise<SubmissionResult> {
    return this.activeProvider.submit(code, languageCode, testCases);
  }
}

export const judgeService = new JudgeService();
export default judgeService;
