import {
  ArrayLiteral,
  ASTKind,
  BlockStatement,
  Bool,
  CallExpression,
  Expression,
  ExpressionStatement,
  FunctionLiteral,
  HashLiteral,
  Identifier,
  IfExpression,
  IndexExpression,
  InfixExpression,
  Integer,
  LetStatement,
  PrefixExpression,
  PrintStatement,
  Program,
  ReturnStatment,
  Statement,
  Str,
  // SingleQuote
} from "./ast";
import Lexer from "./lexer";
import { Token, TokenKind } from "./token";

type PrefixParseFunction = () => Expression;
type InfixParseFunction = (expression: Expression) => Expression;

enum Precedence {
  Lowest,
  Equals,
  LessGreater,
  Sum,
  Product,
  Prefix,
  Call,
  Index
}

const precedences: Partial<Record<TokenKind, Precedence>> = {
  [TokenKind.Equal]: Precedence.Equals,
  [TokenKind.NotEqual]: Precedence.Equals,
  [TokenKind.LessThan]: Precedence.LessGreater,
  [TokenKind.GreaterThan]: Precedence.LessGreater,
  [TokenKind.Plus]: Precedence.Sum,
  [TokenKind.Minus]: Precedence.Sum,
  [TokenKind.Slash]: Precedence.Product,
  [TokenKind.Asterisk]: Precedence.Product,
  [TokenKind.Remainder]: Precedence.Product,
  [TokenKind.LParen]: Precedence.Call,
  [TokenKind.LBracket]: Precedence.Index
};

class Parser {
  lexer: Lexer;
  curToken: Token;
  peekToken: Token;
  prefixParseFunctions: Partial<Record<TokenKind, PrefixParseFunction>>;
  infixParseFunctions: Partial<Record<TokenKind, InfixParseFunction>>;
  errors: Array<String>;

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.curToken = this.lexer.nextToken();
    this.peekToken = this.lexer.nextToken();
    this.errors = [];

    this.parseArrayLiteral = this.parseArrayLiteral.bind(this);
    this.parseBool = this.parseBool.bind(this);
    this.parseCallExpression = this.parseCallExpression.bind(this);
    this.parseFunctionLiteral = this.parseFunctionLiteral.bind(this);
    this.parseHashLiteral = this.parseHashLiteral.bind(this);
    this.parseIdentifier = this.parseIdentifier.bind(this);
    this.parseIfExpression = this.parseIfExpression.bind(this);
    this.parseIndexExpression = this.parseIndexExpression.bind(this);
    this.parseInteger = this.parseInteger.bind(this);
    this.parseGroupedExpression = this.parseGroupedExpression.bind(this);
    this.parsePrefixExpression = this.parsePrefixExpression.bind(this);
    this.parseInfixExpression = this.parseInfixExpression.bind(this);
    this.parseString = this.parseString.bind(this);
    this.parseIllegal = this.parseIllegal.bind(this);
    this.parseSingleQuote = this.parseSingleQuote.bind(this);
    this.parsePrintStatement = this.parsePrintStatement.bind(this);

    this.prefixParseFunctions = {
      [TokenKind.Bang]: this.parsePrefixExpression,
      [TokenKind.False]: this.parseBool,
      [TokenKind.Function]: this.parseFunctionLiteral,
      [TokenKind.LBrace]: this.parseHashLiteral,
      [TokenKind.Ident]: this.parseIdentifier,
      [TokenKind.If]: this.parseIfExpression,
      [TokenKind.Integer]: this.parseInteger,
      [TokenKind.LBracket]: this.parseArrayLiteral,
      [TokenKind.LParen]: this.parseGroupedExpression,
      [TokenKind.Minus]: this.parsePrefixExpression,
      [TokenKind.True]: this.parseBool,
      [TokenKind.String]: this.parseString,
      [TokenKind.Illegal]: this.parseIllegal,
      [TokenKind.SingleQuote]: this.parseSingleQuote,
    };

    this.infixParseFunctions = {
      [TokenKind.Plus]: this.parseInfixExpression,
      [TokenKind.Minus]: this.parseInfixExpression,
      [TokenKind.Slash]: this.parseInfixExpression,
      [TokenKind.Asterisk]: this.parseInfixExpression,
      [TokenKind.Equal]: this.parseInfixExpression,
      [TokenKind.NotEqual]: this.parseInfixExpression,
      [TokenKind.LBracket]: this.parseIndexExpression,
      [TokenKind.LessThan]: this.parseInfixExpression,
      [TokenKind.GreaterThan]: this.parseInfixExpression,
      [TokenKind.LParen]: this.parseCallExpression,
      [TokenKind.Remainder]: this.parseInfixExpression,
    };
  }

  parseProgram(): Program {
    const statements: Statement[] = [];
    while (this.curToken.kind !== TokenKind.EOF) {
      const statement = this.parseStatement();
      if (statement) {
        statements.push(statement);
      }
      this.nextToken();
    }

    return {
      kind: ASTKind.Program,
      statements
    };
  }

  private nextToken(): void {
    this.curToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  private parseStatement(): Statement {
    switch (this.curToken.kind) {
      case TokenKind.Let:
      case TokenKind.AbbrLet:
        return this.parseLetStatement();
      case TokenKind.Return:
        return this.parseReturnStatement();
      case TokenKind.Print:
        return this.parsePrintStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  private parseLetStatement(): LetStatement {
    this.expectPeek(TokenKind.Ident);

    const name: Identifier = {
      kind: ASTKind.Identifier,
      value: this.curToken.literal
    };

    this.expectPeek(TokenKind.Assign);
    this.nextToken();

    const value = this.parseExpression(Precedence.Lowest);

    if (this.peekTokenIs(TokenKind.Semicolon)) {
      this.nextToken();
    }

    return {
      kind: ASTKind.Let,
      name,
      value
    };
  }

  private parsePrintStatement(): PrintStatement {
    const expr = this.parseExpression(Precedence.Lowest);

    return {
      kind: ASTKind.Print,
      value: expr
    }
  }

  private parseReturnStatement(): ReturnStatment {
    this.nextToken();

    const returnValue = this.parseExpression(Precedence.Lowest);

    if (this.peekTokenIs(TokenKind.Semicolon)) {
      this.nextToken();
    }

    return {
      kind: ASTKind.Return,
      returnValue
    };
  }

  private curTokenIs(tokenType: TokenKind): boolean {
    return this.curToken.kind === tokenType;
  }

  private peekTokenIs(tokenType: TokenKind): boolean {
    return this.peekToken.kind === tokenType;
  }

  private expectPeek(tokenType: TokenKind): void {
    if (!this.peekTokenIs(tokenType)) {
      // throw new Error(
      //   `expected next token to be ${tokenType}, got ${this.peekToken.kind} instead`
      // );
      this.errors.push(`Error: expected next ${tokenType}, got ${this.peekToken.kind} instead`);
    }

    this.nextToken();
  }

  private parseExpressionStatement(): ExpressionStatement {
    const expression = this.parseExpression(Precedence.Lowest);

    if (this.peekTokenIs(TokenKind.Semicolon)) {
      this.nextToken();
    }

    return {
      kind: ASTKind.ExpressionStatement,
      expression
    };
  }

  private parseExpression(precedence: Precedence): Expression {
    let prefix = this.prefixParseFunctions[this.curToken.kind];

    if (!prefix) {
      // throw new Error(`No prefix parse function for ${this.curToken.kind}`);
      prefix = this.prefixParseFunctions[TokenKind.Illegal];
      this.errors.push(`No prefix parse function for ${this.curToken.kind}`);
      try {
        switch (this.curToken.kind) {
          // so that 'print' statements do not throw 'no prefix function' errors
          case 'PRINT':
            break;

          default:
            throw `No prefix parse function for ${this.curToken.kind}`;
        }
      } catch (err) {
        console.log(err);
      }
    }

    let leftExpression = prefix!();

    while (
      !this.peekTokenIs(TokenKind.Semicolon) &&
      precedence < this.peekPrecedence()
    ) {
      const infix = this.infixParseFunctions[this.peekToken.kind];

      if (!infix) {
        return leftExpression;
      }

      this.nextToken();

      leftExpression = infix(leftExpression);
    }

    return leftExpression;
  }

  private parseArrayLiteral(): ArrayLiteral {
    const elements = this.parseExpressionList(TokenKind.RBracket);

    return {
      kind: ASTKind.ArrayLiteral,
      elements
    };
  }

  private parseExpressionList(endToken: TokenKind): Expression[] {
    const list: Expression[] = [];

    if (this.peekTokenIs(endToken)) {
      this.nextToken();
      return list;
    }

    this.nextToken();
    list.push(this.parseExpression(Precedence.Lowest));

    while (this.peekTokenIs(TokenKind.Comma)) {
      this.nextToken();
      this.nextToken();

      list.push(this.parseExpression(Precedence.Lowest));
    }

    this.expectPeek(endToken);

    return list;
  }

  private parseBlockStatement(): BlockStatement {
    const statements: Statement[] = [];

    this.nextToken();

    while (
      !this.curTokenIs(TokenKind.RBrace) &&
      !this.curTokenIs(TokenKind.EOF)
    ) {
      statements.push(this.parseStatement());
      this.nextToken();
    }

    return {
      kind: ASTKind.BlockStatement,
      statements
    };
  }

  private parseBool(): Bool {
    return {
      kind: ASTKind.Bool,
      value: this.curTokenIs(TokenKind.True)
    };
  }

  private parseCallExpression(expression: Expression): CallExpression {
    if (
      expression.kind !== ASTKind.Identifier &&
      expression.kind !== ASTKind.FunctionLiteral
    ) {

      throw new Error(
        `parse call expression expected call to be on an identifier or function literal but received ${expression.kind}`
      );
    }

    const args = this.parseExpressionList(TokenKind.RParen);

    return {
      kind: ASTKind.CallExpression,
      function: expression,
      arguments: args
    };
  }

  private parseIdentifier(): Identifier {
    return {
      kind: ASTKind.Identifier,
      value: this.curToken.literal
    };
  }

  private parseFunctionLiteral(): FunctionLiteral {
    this.expectPeek(TokenKind.LParen);

    const parameters = this.parseFunctionParameters();

    this.expectPeek(TokenKind.LBrace);

    const body = this.parseBlockStatement();

    return {
      kind: ASTKind.FunctionLiteral,
      parameters,
      body
    };
  }

  private parseFunctionParameters(): Identifier[] {
    const parameters: Identifier[] = [];

    if (this.peekTokenIs(TokenKind.RParen)) {
      this.nextToken();
      return parameters;
    }

    this.nextToken();

    const identifier: Identifier = {
      kind: ASTKind.Identifier,
      value: this.curToken.literal
    };

    parameters.push(identifier);

    while (this.peekTokenIs(TokenKind.Comma)) {
      this.nextToken();
      this.nextToken();

      const identifier: Identifier = {
        kind: ASTKind.Identifier,
        value: this.curToken.literal
      };

      parameters.push(identifier);
    }

    this.expectPeek(TokenKind.RParen);

    return parameters;
  }

  private parseHashLiteral(): HashLiteral {
    const pairs = new Map();

    while (!this.peekTokenIs(TokenKind.RBrace)) {
      this.nextToken();

      const key = this.parseExpression(Precedence.Lowest);

      this.expectPeek(TokenKind.Colon);
      this.nextToken();

      const value = this.parseExpression(Precedence.Lowest);

      pairs.set(key, value);

      if (!this.peekTokenIs(TokenKind.RBrace)) {
        this.expectPeek(TokenKind.Comma);
      }
    }

    this.expectPeek(TokenKind.RBrace);

    return {
      kind: ASTKind.HashLiteral,
      pairs
    };
  }

  private parseIfExpression(): IfExpression {
    this.expectPeek(TokenKind.LParen);

    this.nextToken();

    const condition = this.parseExpression(Precedence.Lowest);

    this.expectPeek(TokenKind.RParen);
    this.expectPeek(TokenKind.LBrace);

    const consequence = this.parseBlockStatement();

    let alternative;
    if (this.peekTokenIs(TokenKind.Else)) {
      this.nextToken();
      this.expectPeek(TokenKind.LBrace);

      alternative = this.parseBlockStatement();
    }

    return {
      kind: ASTKind.IfExpression,
      condition,
      consequence,
      alternative
    };
  }

  private parseInteger(): Integer {
    return {
      kind: ASTKind.Integer,
      value: parseInt(this.curToken.literal, 10)
    };
  }

  private parsePrefixExpression(): PrefixExpression {
    const operator = this.curToken.literal;

    this.nextToken();

    return {
      kind: ASTKind.PrefixExpression,
      operator,
      right: this.parseExpression(Precedence.Prefix)
    };
  }

  private peekPrecedence(): Precedence {
    return precedences[this.peekToken.kind] || Precedence.Lowest;
  }

  private curPrecedence(): Precedence {
    return precedences[this.curToken.kind] || Precedence.Lowest;
  }

  private parseIndexExpression(left: Expression): IndexExpression {
    this.nextToken();

    const index = this.parseExpression(Precedence.Lowest);

    this.expectPeek(TokenKind.RBracket);

    return {
      kind: ASTKind.IndexExpression,
      left,
      index
    };
  }

  private parseInfixExpression(left: Expression): InfixExpression {
    const operator = this.curToken.literal;
    const precedence = this.curPrecedence();

    this.nextToken();

    const right = this.parseExpression(precedence);

    return {
      kind: ASTKind.InfixExpression,
      operator,
      left,
      right
    };
  }

  private parseGroupedExpression(): Expression {
    this.nextToken();

    const expression = this.parseExpression(Precedence.Lowest);

    this.expectPeek(TokenKind.RParen);

    return expression;
  }

  private parseString(): Str {
    return {
      kind: ASTKind.String,
      value: this.curToken.literal
    };
  }

  private parseIllegal(): Str {
    return {
      kind: ASTKind.String,
      value: this.curToken.literal
    }
  }

  private parseSingleQuote(): Str {
    return {
      kind: ASTKind.String,
      value: this.curToken.literal,
    }
  }
}

export default Parser;
