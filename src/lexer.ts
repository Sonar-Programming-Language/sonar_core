import { Token, TokenKind, lookupIdentifier } from "./token";

export default class Lexer {
  input: string;
  position = 0;
  readPosition = 0;
  ch: string | null = "";

  constructor(input: string) {
    this.input = input;
    this.readChar();
  }

  readChar(): void {
    if (this.readPosition >= this.input.length) {
      this.ch = null;
    } else {
      this.ch = this.input[this.readPosition];
    }
    this.position = this.readPosition;
    this.readPosition += 1;
  }

  nextToken(): Token {
    let token: Token;

    this.skipWhitespace();

    switch (this.ch) {
      case "=":
        if (this.peekChar() == "=") {
          const ch = this.ch;
          this.readChar();
          const literal = ch + this.ch;
          token = this.newToken(TokenKind.Equal, literal);
        } else {
          token = this.newToken(TokenKind.Assign, this.ch);
        }
        break;
      case "+":
        token = this.newToken(TokenKind.Plus, this.ch);
        break;
      case "-":
        token = this.newToken(TokenKind.Minus, this.ch);
        break;
      case "!":
        if (this.peekChar() == "=") {
          const ch = this.ch;
          this.readChar();
          const literal = ch + this.ch;
          token = this.newToken(TokenKind.NotEqual, literal);
        } else {
          token = this.newToken(TokenKind.Bang, this.ch);
        }
        break;
      case "/":
        token = this.newToken(TokenKind.Slash, this.ch);
        break;
      case "*":
        token = this.newToken(TokenKind.Asterisk, this.ch);
        break;
      case "<":
        token = this.newToken(TokenKind.LessThan, this.ch);
        break;
      case ">":
        token = this.newToken(TokenKind.GreaterThan, this.ch);
        break;
      case "%":
        token = this.newToken(TokenKind.Remainder, this.ch);
        break;
      case ";":
        token = this.newToken(TokenKind.Semicolon, this.ch);
        break;
      case ":":
        token = this.newToken(TokenKind.Colon, this.ch);
        break;
      case "(":
        token = this.newToken(TokenKind.LParen, this.ch);
        break;
      case ")":
        token = this.newToken(TokenKind.RParen, this.ch);
        break;
      case ",":
        token = this.newToken(TokenKind.Comma, this.ch);
        break;
      case "{":
        token = this.newToken(TokenKind.LBrace, this.ch);
        break;
      case "}":
        token = this.newToken(TokenKind.RBrace, this.ch);
        break;
      case "[":
        token = this.newToken(TokenKind.LBracket, this.ch);
        break;
      case "]":
        token = this.newToken(TokenKind.RBracket, this.ch);
        break;
      case '"':
        token = this.newToken(TokenKind.String, this.readString());
        break;
      case '\'':
        token = this.newToken(TokenKind.SingleQuote, this.readSingleQuote());
        break;
      case '$':
        token = this.newToken(TokenKind.AbbrLet, this.ch);
        break;
      case null:
        token = this.newToken(TokenKind.EOF, "");
        break;
      default:
        if (this.isLetter(this.ch)) {
          const literal = this.readIdentifier();
          return this.newToken(lookupIdentifier(literal), literal);
        } else if (this.isDigit(this.ch)) {
          const number = this.readNumber();
          return number[0] == true ? this.newToken(TokenKind.Double, number[1]) : this.newToken(TokenKind.Integer, number[1]);
        } else {
          token = this.newToken(TokenKind.Illegal, this.ch);
        }
    }

    this.readChar();
    return token;
  }

  private newToken(kind: TokenKind, ch: string): Token {
    return { kind, literal: ch };
  }

  private readIdentifier(): string {
    const position = this.position;
    while (this.ch && this.isLetter(this.ch)) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  // TODO: unicode support
  private isLetter(ch: string): boolean {
    return /[a-z]|[A-Z]|\_/.test(ch);
    return ("a" <= ch && ch <= "z") || ("A" <= ch && ch <= "Z") || ch == "_";
  }

  private skipWhitespace(): void {
    while (
      this.ch === " " ||
      this.ch === "\t" ||
      this.ch === "\n" ||
      this.ch === "\r"
    ) {
      this.readChar();
    }
  }

  private readNumber(): [boolean, string] {
    const position = this.position;
    let isDouble = false;
    while (this.ch && this.isDigit(this.ch)) {
      this.readChar();
      if (this.ch == TokenKind.Dot) {
        if (isDouble == false) isDouble = true;
        else return [isDouble, this.input.slice(position, this.position)];
      }
    }
    return [isDouble, this.input.slice(position, this.position)];
  }

  private isDigit(ch: string): boolean {
    return ("0" <= ch && ch <= "9") || ch === '.';
  }

  private readString(): string {
    const position = this.position + 1;
    do {
      this.readChar();
    } while (this.ch && this.ch !== '"');

    return this.input.slice(position, this.position);
  }

  private readSingleQuote(): string {
    const position = this.position + 1;
    do {
      this.readChar();
    } while (this.ch && this.ch !== '\'');

    return this.input.slice(position, this.position);
  }

  private peekChar(): string | null {
    if (this.readPosition >= this.input.length) {
      return null;
    }
    return this.input[this.readPosition];
  }
}
