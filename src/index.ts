import { evaluate } from "./evaluator";
import Lexer from "./lexer";
import { Environment } from "./object";
import Parser from "./parser";


const input: string = `
$a = 'Hello';
$b = 'World';

$c = toTitle("iufdhlk iuhs uayj");

print c;

    


`;
// const input: string = `
// print getIndex([[1, 2], [2, 4], [3]], [3)
// `;

const program = new Parser(new Lexer(input)).parseProgram();

// console.log(new Parser(new Lexer(input)))

const res = evaluate(program, new Environment());
console.log(res.inspect());
// console.log("==========");
// console.log(program.statements);


export const x = {};