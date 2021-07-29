import { throwIllegalNumberOfArgumentsError } from "../builtins";
import { Arr, Builtin, Err, Integer, Null, Obj, Str } from "../object";

const strings: { [key: string]: Builtin } = {
    /**
     * getIndex(arg1: Str | Arr[T], arg2: Str | T): Integer | Err
     * 
     * Returns the index of the first occurrence of args[1] in args[0] if args[1] is of type Arr or Str.
     * Returns -1 if args[1] is not found in args[0].
     * Otherwise, returns an error.
     */
    getIndex: new Builtin(
        (...args: Array<Obj>): Obj => {
            if (args.length !== 2) {
                return throwIllegalNumberOfArgumentsError(
                    'getIndex()', 2, args.length
                );
            }

            let arr = args[0];
            let elm = args[1];
            let index = -1;

            if (arr instanceof Str) {
                if (elm instanceof Str) {
                    index = arr.value.indexOf(elm.value);
                } else {
                    return new Err(
                        `Cannot getIndex of value <${elm.type}> in <${arr.inspect()}>`
                    );
                }
            } else if (arr instanceof Arr) {
                let e = elm as unknown as any;
                index = arr.elements.findIndex(v => {
                    let a = v as unknown as any;
                    return a.inspect() == e.inspect();
                });
            } else {
                return new Err(
                    `Cannot getIndex of data of type <${arr.type}>`
                );
            }

            return new Integer(index);
        }
    ),

    /**
     * replace(arg1: Arr | Str, arg2: Obj, arg3: Obj): Str | Arr | Err
     * 
     * Replaces the first occurrence of args[0] in args[0] with args[2]
     * args[0] must be of type Str or Arr
     * if args[0] is Arr, args[1] and args[2] can be of any type
     * if args[0] is Str, args[1] and args[2] can only be of Str
     */
    replace: new Builtin(
        (...args: Array<Obj>): Obj => {
            if (args.length !== 3) {
                return throwIllegalNumberOfArgumentsError(
                    'replace()', 3, args.length
                );
            }

            if (args[0] instanceof Arr) {
                let e = args[1] as unknown as any;
                let i: number = args[0].elements.findIndex(v => {
                    let a = v as unknown as any;
                    return a.inspect() == e.inspect();
                });

                if (i == -1) {
                    return args[0];
                } else {
                    let v: Array<Obj> = args[0].elements.splice(i, 1);
                    v = args[0].elements.slice(0, i).concat(args[2]);
                    v = v.concat(args[0].elements.slice(i));
                    // console.log(v)
                    args[0].elements = v;
                    return args[0];
                }
            } else if (args[0] instanceof Str) {
                if (args[1] instanceof Str) {
                    if (args[2] instanceof Str !== true) {
                        return new Err(
                            `Element of type <${args[2].type}> cannot exist in data of type <${args[0].type}>`
                        );
                    }

                    let i: number = args[0].value.indexOf(args[1].value);
                    let l: string = args[0].value.slice(0, i);
                    l += args[2].inspect().slice(1, -1);
                    l += args[0].value.slice(i + 1);
                    args[0].value = l;
                    return args[0];
                } else {
                    return new Err(
                        `Element of type <${args[1].type}> does not exist in data of type <${args[0].type}>`
                    );
                }
            }

            return new Null();
        }
    ),

    /**
     * replaceAll(arg1: [T]Arr | Str, arg2: T | Str, arg3: Obj): Str | Arr | Err
     * Replaces every occurrence of args[2] with args[3] in args[1]
     * 
     * Conditions are same as in replace()
     */
    replaceAll: new Builtin(
        (...args: Array<Obj>): Obj => {
            if (args.length !== 3) {
                return throwIllegalNumberOfArgumentsError(
                    'replaceAll()', 3, args.length
                );
            }

            if (args[0] instanceof Arr) {
                args[0].elements.forEach((e: Obj, i: number, A: Array<Obj>) => {

                    if (e.hasOwnProperty('value') && args[1].hasOwnProperty('value')) {
                        let tmp: any = e as unknown as any;
                        let arg2: any = args[1] as unknown as any;

                        // this performs type-checking, preventing 1 == '1'
                        if (tmp.value == arg2.value && tmp.type == arg2.type) {
                            A[i] = args[2];
                        }
                    } else {
                        let tmp: any = e as unknown as any;
                        let arg2: any = args[1] as unknown as any;

                        if (tmp.inspect() == arg2.inspect()) {
                            A[i] = args[2];
                        }
                    }
                });
                return args[0];
            } else if (args[0] instanceof Str) {
                let s: any = args[0].value;
                args[0].value.split(',').forEach((e: string, i: number) => {
                    let tmp: any = e as unknown as any;
                    if (
                        args[1].hasOwnProperty('value')
                        &&
                        tmp.value == args[1].value
                        &&
                        args[1] instanceof Str
                        &&
                        args[2] instanceof Str
                    ) {
                        s[i] = args[2].value;
                    }
                });

                args[0].value = s;
                return args[0];
            } else {
                return new Err('arg 1 of replaceAll() must be of type <String> or <Array>');
            }

        }
    ),

    /**
     * intersperse(arg1: Str , separator: Str ?? Sep(',')): [Str]Arr
     * 
     * Returns an Arr of elements interspersed with args[1] ?? ','
     */
    intersperse: new Builtin(
        (...args: Array<Obj>): Obj => {
            if (args.length > 2) {
                return throwIllegalNumberOfArgumentsError(
                    'intersperse()', 2, args.length
                );
            }

            if (!args[1]) args[1] = new Str(',');

            if (args[0] instanceof Str) {
                if (args[1] instanceof Str) {
                    let s: Array<Obj> = [];
                    let sep: string = args[1].value;

                    args[0].value.split('').forEach((v: string, i: number, A: Array<string>) => {
                        s.push(new Str(v));
                        if (i < A.length - 1)
                            s.push(new Str(sep));
                    });
                    return new Arr(s);
                } else {
                    return new Err(
                        `intersperse() requires a separator of type <String>, got ${args[1].type}`
                    );
                }
            } else {
                return new Err(
                    `intersperse() requires a String as its first argument, got ${args[0].type}`
                );
            }
        }
    ),

    /**
     * explode(string: Str, separator: Str = Sep('||')): Arr[Str]
     * 
     * (PHP-style) "explodes" a given string into an array of elements, separated by "separator"
     */
    explode: new Builtin(
        (...args: Array<Obj>): Obj => {
            if (args.length > 2) {
                return throwIllegalNumberOfArgumentsError(
                    'explode()', 2, args.length
                );
            }

            if (!args[1]) {
                args[1] = new Str('||');
            }

            if (args[0] instanceof Str) {
                if (args[1] instanceof Str) {
                    let s: Array<Obj> = [];
                    let sep: string = args[1].value;

                    args[0].value.split(sep).forEach((v: string, i: number, A: Array<string>) => {
                        s.push(new Str(v));
                    });
                    return new Arr(s);
                } else {
                    return new Err(
                        `explode() requires a separator of type <String>, got ${args[1].type}`
                    );
                }
            } else {
                return new Err(
                    `explode() requires a String as its first argument, got ${args[0].type}`
                );
            }
        }
    ),

    /**
     * implode(array: Arr[Obj], separator: Str = Sep('||')): Str | Err
     * 
     * (PHP-style) "explodes" a given string into an array of elements, separated by "separator"
     */
    implode: new Builtin(
        (...args: Array<Obj>): Obj => {
            if (args.length !== 1 && args.length !== 2) {
                return throwIllegalNumberOfArgumentsError(
                    'explode()', 2, args.length
                );
            }

            if (args[0] instanceof Arr) {
                if (!args[1]) args[1] = new Str('||');

                let s: string = '';
                args[0].elements.forEach((e: Obj, i: number, A: Array<Obj>) => {
                    s += e.inspect();
                    if (i < A.length - 1) s += args[1].value;
                });

                args[0] = new Str(s);
                return args[0];
            } else {
                return new Err(
                    `implode() expects argument 1 to be <Array>, got <${args[0].type}>`
                );
            }
        }
    ),

    /**
     * concat(...args: Obj{1,}): Str
     * Returns a concatenation of stringified arguments
     */
    concat: new Builtin(
        (...args: Array<Obj>): Obj => {
            if (args.length < 1)
                return new Err(
                    `concat() requires at least one argument`
                );
            let s: string = '';

            args.forEach(e => {
                s += (e.value ?? e.inspect());
            });

            return new Str(s);
        }
    ),

    str: new Builtin(
        (...args: Array<Obj>): Obj => {
            if (args.length !== 1)
                return throwIllegalNumberOfArgumentsError(
                    'str()', 1, args.length
                );

            return new Str(args[0].value ?? args[0].inspect());
        }
    ),

    toUpper: new Builtin(
        (...args: Array<Obj>): Obj => {
            if (args.length !== 1)
                return throwIllegalNumberOfArgumentsError(
                    'toUpper()', 1, args.length
                );

            if (args[0] instanceof Str) return new Str(args[0].value.toUpperCase());
            return new Err(
                `argument to toUpper() must be of type <String>`
            );
        }),

    toLower: new Builtin(
        (...args: Array<Obj>): Obj => {
            if (args.length !== 1)
                return throwIllegalNumberOfArgumentsError(
                    'toLower()', 1, args.length
                );

            if (args[0] instanceof Str) return new Str(args[0].value.toLowerCase());
            return new Err(
                `argument to toLower() must be of type <String>`
            );
        }),

    capitalize: new Builtin(
        (...args: Array<Obj>): Obj => {
            if (args.length !== 1)
                return throwIllegalNumberOfArgumentsError(
                    'capitalize()', 1, args.length
                );

            if (args[0] instanceof Str) return new Str(
                args[0].value[0].toUpperCase() + args[0].value.slice(1)
            );
            return new Err(
                `argument to capitalize() must be of type <String>`
            );
        }),
    toTitle: new Builtin(
        (...args: Array<Obj>): Obj => {
            if (args.length !== 1)
                return throwIllegalNumberOfArgumentsError(
                    'toTitle()', 1, args.length
                );

            if (args[0] instanceof Str) {
                let a: string = args[0].value.split(' ').map(e => e[0].toUpperCase() + e.slice(1)).join(' ');
                return new Str(a);
            }

            return new Err(
                `argument to toTitle() must be of type <String>`
            );
        }),
}

export default strings;