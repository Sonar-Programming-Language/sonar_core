import { evaluate } from "./evaluator";
import Lexer from "./lexer";
import { Environment } from "./object";
import Parser from "./parser";


// const input: string = 
const input: string = `

`;

const program = new Parser(new Lexer(input)).parseProgram();

// console.log(new Parser(new Lexer(input)))

const res = evaluate(program, new Environment());
console.log(res.inspect());


export const x = {};