export function wrapCode(
  language: "javascript" | "python" | "java",
  userCode: string
): string {
  switch (language) {
    case "javascript":
      return `
const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim();

${userCode}

const result = typeof isPalindrome === "function"
  ? isPalindrome(input)
  : undefined;

if (result !== undefined) {
  console.log(result.toString());
}
`;

    case "python":
      return `
import sys

${userCode}

input_data = sys.stdin.read().strip()
result = isPalindrome(input_data)
print(str(result).lower())
`;

    case "java":
      return `
import java.util.*;

public class Main {

${userCode.replace(
  "public ",
  "public static "
)}

  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String input = sc.nextLine();
    boolean result = isPalindrome(input);
    System.out.println(result);
  }
}
`;
  }
}
