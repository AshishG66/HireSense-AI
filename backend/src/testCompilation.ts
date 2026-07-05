import { LocalJudgeProvider } from './services/judge.service';

async function testAll() {
  const judge = new LocalJudgeProvider();

  const javaCode = `
public class Main {
    public static void main(String[] args){
        System.out.println("Hello Java");
    }
}
  `;

  const pythonCode = `print("Hello Python")`;

  const cCode = `
#include <stdio.h>
int main(){
    printf("Hello C");
}
  `;

  const cppCode = `
#include <iostream>
using namespace std;
int main(){
    cout<<"Hello C++";
}
  `;

  const jsCode = `console.log("Hello JS")`;

  const tsCode = `console.log("Hello TS")`;

  const tests = [
    { name: 'Java', lang: 'java', code: javaCode },
    { name: 'Python', lang: 'python', code: pythonCode },
    { name: 'C', lang: 'c', code: cCode },
    { name: 'C++', lang: 'cpp', code: cppCode },
    { name: 'JavaScript', lang: 'javascript', code: jsCode },
    { name: 'TypeScript', lang: 'typescript', code: tsCode }
  ];

  console.log("=== COMPILATION AND RUNTIME VERIFICATION LOGS ===");

  for (const t of tests) {
    try {
      const res = await judge.execute(t.code, t.lang, "");
      console.log(`\n[${t.name}] Status: ${res.status}`);
      if (res.stderr) {
        console.error(`Error: ${res.stderr}`);
      } else {
        console.log(`Output: "${(res.stdout || '').trim()}"`);
      }
    } catch (e: any) {
      console.error(`[${t.name}] Unexpected error:`, e.message);
    }
  }
}

testAll();
