import { program } from 'commander'
import { readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path';

type typesString = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function" | "array" | "null"

const { default: { version, name } } = await import(import.meta.resolve('../package.json'), { with: { type: 'json' } })

const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
}
const {
    indent: INDENT,
    lang: LANG,
    output: OUTPUT,
    quiet: QUIET,
    semi: SEMI,
    strict: STRICT,
    typing: NO_TYPING,
    recursive: RECURSIVE,
    mapping: MAPPING,
    development: DEVELOPMENT
} = program
    .name(name)
    .version(version)
    .usage('[path] [options]')
    .argument('[path]', 'path to translate')
    .option('-o, --output <output>', 'set output file', './locales')
    .option('-l, --lang <lang>', 'set lang: ts, js o json', 'ts')
    .option('-m, --mapping', 'create a mapping for utils', true)
    .option('-i, --indent <number>', 'set indent', '2')
    .option('--semi <semi>', 'use semi', false)
    .option('--no-typing', 'export without typing', false)
    .option('-q, --quiet', 'quiet mode', false)
    .option('-s, --strict', 'strict mode, check if the files are complet', true)
    .option('-r, --recursive', 'recursive mode in the folder', false)
    .option('-D, --development', 'development mode, does not generate code for production', false)
    .parse([...process.argv, './'])
    .opts<{
        output: string,
        lang: "ts" | "js" | "json",
        indent: string,
        semi: boolean,
        typing: boolean,
        quiet: boolean,
        strict: boolean,
        recursive: boolean,
        mapping: boolean,
        development: boolean
    }>();

if ((LANG === 'ts' && NO_TYPING && STRICT) && !DEVELOPMENT) {
    if (!QUIET) console.log(`${colors.yellow}Warning: ${colors.cyan}--no-typing ${colors.reset}and ${colors.cyan}--strict ${colors.reset}are incompatible, --strict will be ignored`);
}
if ((LANG === 'ts' && NO_TYPING && MAPPING) && !DEVELOPMENT) {
    if (!QUIET) console.log(`${colors.yellow}Warning: ${colors.cyan}--no-typing ${colors.reset}and ${colors.cyan}--mapping ${colors.reset}are incompatible, --strict will be ignored`);
}

interface Merge {
    (deep: boolean, obj1: any, ...objn: any[]): any;
    (obj1: any, ...objn: any[]): any;
}

// the following method was taken from the just library under the MIT license
// see: https://github.com/angus-c/just/blob/d8c5dd18941062d8db7e9310ecc8f53fd607df54/packages/object-extend/index.mjs#L31
const merge: Merge = (...args) => {
    var deep = false;
    if (typeof args[0] === 'boolean') {
        deep = args.shift();
    }
    var result = args[0];
    if (isUnextendable(result)) {
        throw new Error('extendee must be an object');
    }
    var extenders = args.slice(1);
    var len = extenders.length;
    for (var i = 0; i < len; i++) {
        var extender = extenders[i];
        for (var key in extender) {
            if (Object.prototype.hasOwnProperty.call(extender, key)) {
                var value = extender[key];
                if (deep && isCloneable(value)) {
                    var base = Array.isArray(value) ? [] : {};
                    result[key] = merge(
                        true,
                        Object.prototype.hasOwnProperty.call(result, key) && !isUnextendable(result[key])
                            ? result[key]
                            : base,
                        value
                    );
                } else {
                    result[key] = value;
                }
            }
        }
    }
    return result;
}

function isCloneable(obj: object) {
    return Array.isArray(obj) || {}.toString.call(obj) == '[object Object]';
}

function isUnextendable(val: any) {
    return !val || (typeof val != 'object' && typeof val != 'function');
}

const [PATH] = program.args
const JSONS = []
const MAP: { [key: string]: string[] } = {}
// read all json files
const DIR = readdirSync(PATH, { withFileTypes: true, recursive: RECURSIVE }).filter(dirent => dirent.isFile() && dirent.name.endsWith('.json'));
const objectsNames = []
if (DIR.length === 0) {
    if (!QUIET) console.log(`${colors.red}Error: ${colors.cyan}${PATH} ${colors.reset}is empty`)
}

for (const dirent of DIR) {
    try {
        const { default: json } = await import(join(process.cwd(), PATH, dirent.name), { with: { type: 'json' } })
        JSONS.push(json)
        objectsNames.push(dirent.name)
    } catch (error) {
        if ((error as Error).message.includes('Unexpected end of JSON input') && !QUIET)
            console.error(`${colors.yellow}Warning: ${colors.cyan}${dirent.name} ${colors.reset}is empty`)
        else if ((error as Error).message.includes('Unexpected token') && !QUIET)
            console.error(`${colors.red}Error: ${colors.cyan}${dirent.name} ${colors.reset}is not a valid JSON`)
        else if ((error as Error).message.includes('Expected property name or \'}\' in JSON at position') && !QUIET)
            console.error(`${colors.red}Error: ${colors.cyan}${dirent.name} ${colors.reset}is not a valid JSON`)
        else if (!QUIET)
            console.error(error);
    }
}

if (JSONS.length === 0) {
    if (!QUIET)
        console.error(`${colors.red}Error: ${colors.cyan}${PATH} ${colors.reset}is empty`)
    process.exit(1)
}

const intlForList = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' })
if (!QUIET) console.log(`${colors.blue}Info: ${colors.cyan}${intlForList.format(objectsNames)} ${colors.reset}files loaded`)

const MASTER = merge(true, {}, ...JSONS)

function createJSON(obj: Record<string, any>, path: string[]): object {
    let out: { [key: string]: any } = {}
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            out[key] = [...path, key].join('.')
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            out[key] = createJSON(value, [...path, key])
        }
    }
    return out
}
if (LANG === 'json' && ! !DEVELOPMENT) {
    const outJSON = createJSON(MASTER, [])
    const outputFileName = OUTPUT.endsWith('.json') ? OUTPUT : OUTPUT + '.json'
    writeFileSync(outputFileName, JSON.stringify(outJSON, null, +INDENT), 'utf-8')
    if (!QUIET)
        console.log(`${colors.green}Success: ${colors.cyan}${outputFileName}${colors.reset} created`)
    process.exit(0)
}

function getMustache(key: string, objs: Record<string, string>[]): string {
    const allTexts = objs.map(o => o[key]).filter(Boolean).join(' ')
    const mustaches = [...new Set(allTexts.match(/({[^}]*})/g) ?? [])].join(' ')
    return mustaches
}

function registerMap(key: string, value: string) {
    if (MAPPING) {
        MAP[key] = value ? value.split(' ').map(m => m.replace(/[{}]/g, '')) : []
    }
}

function createObject(obj: Record<string, any>, objs: Record<string, any>[], path: string[], indentSpace: number, recursive?: boolean): string {
    let out = '{\n'
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            const mustaches = getMustache(key, objs)
            registerMap([...path, key].join('.'), mustaches)
            out += `${' '.repeat(indentSpace)}"${key}": "${[...path, key].join('.')}", ${mustaches ? `/** @description "${getMustache(key, objs)}" */` : ''}\n`
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            out += `${' '.repeat(indentSpace)}"${key}": ${createObject(obj[key], objs.map(o => o[key]).filter(Boolean), [...path, key], indentSpace + (+INDENT), true)}`
        }
    }
    return out + `${' '.repeat(indentSpace - (+INDENT))}}${recursive ? ',' : ''}\n`

}

const outObj = createObject(MASTER, JSONS, [], +INDENT)
const outType = `${createType(MASTER, JSONS, [], +INDENT)}`

function createType(obj: Record<string, any>, objs: Array<Record<string, any>>, path: string[], indentSpace: number, recursive?: boolean): string {
    let out = '{\n'
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            const mustaches = getMustache(key, objs)
            // check if exists in other files
            const [existsInAll, allAreString] = existsAndIsSameType(key, objs, 'string')
            // if is not a same type in all files
            if (existsInAll && !allAreString) {
                if (!QUIET) console.error(`${colors.red}Error: ${colors.cyan}${path.concat(key).join('.')} ${colors.reset}is not a same type in all files`);
            } // is a same type in all files 
            else out += `${' '.repeat(indentSpace)}"${key}"${!existsInAll && STRICT ? '?' : ''}: "${path.concat(key).join('.')}", ${mustaches ? `/** @description "${getMustache(key, objs)}" */` : ''}\n`
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // check if exists in other files
            const [existsInAll, allAreObjects] = existsAndIsSameType(key, objs, 'object')
            // if is not a same type in all files
            if (existsInAll && !allAreObjects) {
                if (!QUIET) console.error(`${colors.red}Error: ${colors.cyan}${path.concat(key).join('.')} ${colors.reset}is not a same type in all files`);
            } // is a same type in all files 
            else out += `${' '.repeat(indentSpace)}"${key}"${!existsInAll && STRICT ? '?' : ''}: ${createType(obj[key], objs.map(o => o[key]).filter(Boolean), [...path, key], indentSpace + (+INDENT), true)}`
        }
    }
    return out + `${' '.repeat(indentSpace - (+INDENT))}}${recursive ? ',' : ''}\n`
}

function existsAndIsSameType(key: string, objs: Array<Record<string, any>>, typeToCheck: typesString): [boolean, boolean] {
    const existsInAll = objs.every(o => typeof o[key] !== 'undefined')
    const allAreString = objs.every(o => typeToCheck === 'object'
        ? typeof o[key] === 'object' && o[key] !== null && !Array.isArray(o[key])
        : typeToCheck === 'array'
            ? Array.isArray(o[key])
            : typeToCheck === 'null'
                ? o[key] === null
                : typeof o[key] === typeToCheck)
    return [existsInAll, allAreString]
}

function createMapping(): string {
    let out = '\n\nexport type LocalesMap = {\n'
    for (const [key, value] of Object.entries(MAP)) {
        out += `${' '.repeat(+INDENT)}"${key}": { ${value.map(t => `"${t}": string,`).join(' ')} },\n`
    }
    return out + '}\n'
}

if (LANG === 'js' && !DEVELOPMENT) {
    const outputFileName = OUTPUT.endsWith('.js') ? OUTPUT : OUTPUT + '.js'
    writeFileSync(outputFileName, `${!NO_TYPING?`/**\n * @type {${outType.replace(/\n|\s/g,'')}}\n */\n`:''}export default ${outObj}${SEMI ? ';' : ''}`, 'utf-8')
    if (!QUIET)
        console.log(`${colors.green}Success: ${colors.cyan}${outputFileName}${colors.reset} created`)
    process.exit(0)
}

if (LANG === 'ts') {
    const outputFileName = OUTPUT.endsWith('.ts') ? OUTPUT : OUTPUT + '.ts'
    if (NO_TYPING && !DEVELOPMENT) {
        writeFileSync(outputFileName, `const keys = ${outObj}${SEMI ? ';' : ''} as const\n\nexport default keys`, 'utf-8')
    } else if (DEVELOPMENT) writeFileSync(join(import.meta.dirname, 'LocalesMap.d.ts'), `${createMapping()}\n\nexport {}`, 'utf-8')
    else writeFileSync(outputFileName, `type Locales = ${outType}\n\nconst keys: Locales = ${outObj}${SEMI ? ';' : ''}\n\nexport default keys ${MAPPING ? createMapping() : ''}`, 'utf-8')
    if (!QUIET)
        console.log(`${colors.green}Success: ${colors.cyan}${DEVELOPMENT?'':outputFileName}${colors.reset}${DEVELOPMENT?'types':''} ${DEVELOPMENT?'loaded':'created'}`)
    process.exit(0)
}