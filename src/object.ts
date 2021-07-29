import { BlockStatement, Identifier } from "./ast";
import { print } from "./printer";

class Environment {
  store: { [key: string]: Obj };
  outer: Environment | null;

  constructor(outer: Environment | null = null) {
    this.outer = outer;
    this.store = {};
  }

  get(name: string): Obj | undefined {
    const value = this.store[name];

    if (!value && this.outer) {
      return this.outer.get(name);
    }

    return value;
  }

  set(name: string, value: Obj): Obj {
    this.store[name] = value;
    return value;
  }
}

// Objects

export interface Obj extends Object {
  [x: string]: any;
  type: string;
  inspect(): string;
}

class Arr implements Obj {
  type: string;
  elements: Obj[];

  constructor(elements: Obj[]) {
    this.elements = elements;
    this.type = 'Array';
  }

  inspect(): string {
    const elements = this.elements.map(element => element.inspect());
    return `[${elements.join(", ")}]`;
  }
}

class Bool implements Obj {
  value: boolean;
  type: string;

  constructor(value: boolean) {
    this.value = value;
    this.type = 'Boolean';
  }

  inspect(): string {
    return this.value.toString();
  }
}

class Print implements Obj {
  value: Obj;
  type: string;

  constructor(value: Obj) {
    this.value = value;
    this.type = 'print-statement';
  }

  inspect(): string {
    return this.value.inspect();
  }
}

type BuiltinFunction = (...args: Obj[]) => Obj;

class Builtin implements Obj {
  function: BuiltinFunction;
  type: string;

  constructor(func: BuiltinFunction) {
    this.function = func;
    this.type = 'built-in';
  }

  inspect(): string {
    return "<built-in>";
  }
}

class Err implements Obj {
  message: string;
  type: string;

  constructor(message: string) {
    this.message = message;
    this.type = 'Error';
  }

  inspect(): string {
    return `Error: ${this.message}`;
  }
}

class Func implements Obj {
  parameters: Identifier[];
  body: BlockStatement;
  environment: Environment;
  type: string;

  constructor(
    parameters: Identifier[],
    body: BlockStatement,
    environment: Environment
  ) {
    this.parameters = parameters;
    this.body = body;
    this.environment = environment;
    this.type = 'Function';
  }

  inspect(): string {
    const parameters = this.parameters.map(param => param.value).join(", ");
    const body = print(this.body);
    return `<function(${parameters}) {\n  ${body}\n}`;
  }
}

export type HashKey = string | number | boolean;

export type HashPair = {
  key: Str | Integer | Bool;
  value: Obj;
};

export type HashPairs = Map<HashKey, HashPair>;

class Hash implements Obj {
  pairs: HashPairs = new Map();
  type: string;

  constructor() {
    this.type = 'Map';
  }

  inspect(): string {
    const pairs = [];

    for (const { key, value } of this.pairs.values()) {
      pairs.push(`${key.inspect()}: ${value.inspect()}`);
    }

    return `{${pairs.join(", ")}}`;
  }
}

class Integer implements Obj {
  value: number;
  type: string;

  constructor(value: number) {
    this.value = value;
    this.type = 'Integer';
  }

  inspect(): string {
    return this.value.toFixed(0);
  }
}

class Null implements Obj {
  type: string;

  constructor() {
    this.type = 'Nil-Type';
  }

  inspect(): string {
    // return "";
    return "null";
  }
}

class ReturnValue implements Obj {
  value: Obj;
  type: string;

  constructor(value: Obj) {
    this.value = value;
    this.type = 'return-statement';
  }

  inspect(): string {
    return this.value.inspect();
  }
}

class Str implements Obj {
  value: string;
  type: string;

  constructor(value: string) {
    this.value = value;
    this.type = 'String';
  }

  inspect(): string {
    return `"${this.value}"`;
  }
}

export {
  Arr,
  Bool,
  Builtin,
  Environment,
  Err,
  Func,
  Hash,
  Integer,
  Null,
  ReturnValue,
  Str,
  Print
};
