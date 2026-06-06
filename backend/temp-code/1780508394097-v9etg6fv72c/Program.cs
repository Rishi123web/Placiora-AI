using System;

class Program {
  static string ReverseString(string str) {
    char[] arr = str.ToCharArray();
    Array.Reverse(arr);
    return new string(arr);
  }

  static void Main() {
    Console.WriteLine(ReverseString("hello"));
  }
}