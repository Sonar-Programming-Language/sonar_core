export enum TokenKind {
  Illegal = "ILLEGAL",
  EOF = "EOF",

  // Identifiers + literals
  Ident = "IDENT",
  Integer = "INTEGER",
  String = "STRING",

  // Operators
  Assign = "=",
  Plus = "+",
  Minus = "-",
  Bang = "!",
  Asterisk = "*",
  Slash = "/",

  LessThan = "<",
  GreaterThan = ">",

  Equal = "==",
  NotEqual = "!=",

  Remainder = "%",

  // Delimiters
  Comma = ",",
  Semicolon = ";",
  Colon = ":",
  LParen = "(",
  RParen = ")",
  LBrace = "{",
  RBrace = "}",
  LBracket = "[",
  RBracket = "]",
  SingleQuote = "'",

  // Keywords
  Function = "FUNCTION",
  Let = "LET",
  True = "TRUE",
  False = "FALSE",
  If = "IF",
  Else = "ELSE",
  Return = "RETURN",
  AbbrLet = "$",
  Print = "PRINT"
}

export type Token = {
  kind: TokenKind;
  literal: string;
};

const keywords: { [keyword: string]: TokenKind } = {
  def: TokenKind.Function,
  let: TokenKind.Let,
  true: TokenKind.True,
  false: TokenKind.False,
  if: TokenKind.If,
  else: TokenKind.Else,
  return: TokenKind.Return,
  print: TokenKind.Print
};

export function lookupIdentifier(identifier: string): TokenKind {
  return keywords[identifier] || TokenKind.Ident;
}
