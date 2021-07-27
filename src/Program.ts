import { Program } from "./ast";
import { evaluate } from "./evaluator";
import Lexer from "./lexer";
import { Environment, Obj } from "./object";
import Parser from "./parser";

class Sonar {
    ast: Program;
    result: Obj;
    logs: Array<string>;

    constructor(source: string) {
        this.ast = new Parser(new Lexer(source)).parseProgram();

        const res = this.captureLogs();
        this.result = res[0];
        this.logs = res[1];
    }

    captureLogs(): [Obj, Array<string>] {
        const cl = console.log;
        const logs: Array<string> = [];

        console.log = (...args: Array<string>): void => {
            logs.push(...args);
        }

        const result = evaluate(this.ast, new Environment());

        console.log = cl;
        return [result, logs];
    }
}


export default Sonar;