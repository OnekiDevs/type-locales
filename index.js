#!/usr/bin/env node
import { readdir, writeFile } from 'node:fs/promises'

const cwd = process.cwd()
const files = (await readdir(cwd)).filter((file) => file.endsWith('.json'))
const jsons = []

for (const file of files) {
    const json = await import(`${cwd}/${file}`, { assert: { type: 'json' } })
    jsons.push({ locale: file.split('.')[0], value: json.default })
}

const typeBase = merge({}, ...jsons.map(({ value }) => value))
const [ts, js] = typeGenerator(typeBase)
let types_generated = `export default ${js} satisfies ${ts}`
await writeFile(`${cwd}/locales.ts`, types_generated)

/**
 * generate type
 * @param {any} obj object base
 * @param {number} [tab] tabs to add
 * @param {string[]} [check] check path
 * @returns {[string, {[key:string]:string}]} [type, object]
 */
function typeGenerator(obj, tab = 2, check = []) {
    let object = '{\n'
    let type = '{\n'
    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            let isOptional = false
            for (const { value, locale } of jsons) {
                const json = getNestedObject(value, check)
                if (!json?.[key]) {
                    console.warn(`\x1b[33mWARNING:\x1b[0m key \x1b[32m"${[...check, key].join('.')}"\x1b[0m not found in \x1b[32m"${locale}.json"\x1b[0m`)
                    isOptional = true
                }
            }
            object += `${' '.repeat(tab)}'${key}': "${[...check, key].join('.')}",\n`
            type += `${' '.repeat(tab)}${key}${isOptional ? '?' : ''}: string\n`
        } else if (typeof obj[key] === 'object') {
            try {
                const nested = jsons.map((j) => ({value:getNestedObject(j.value, [...check, key]), locale:j.locale}))
                const isOptional = nested.some((j) => j.value === undefined)
                if (isOptional) {
                    const optonales = nested.filter((j) => j.value === undefined).map((j) => j.locale)
                    for (const locale of optonales) {
                        console.warn(`\x1b[33mWARNING:\x1b[0m key \x1b[32m"${[...check, key].join('.')}"\x1b[0m not found in \x1b[32m"${locale}.json"\x1b[0m`)
                    }
                }
                const mergeds = merge({}, ...nested.map(j => j.value).filter(j => j !== undefined))
                const [t, o] = typeGenerator(mergeds, tab + 2, [...check, key])
                type += `${' '.repeat(tab)}${key}${isOptional ? '?' : ''}: ${t}\n`
                object += `${' '.repeat(tab)}'${key}': ${o},\n`
            } catch (error) {
                const b = {}
                for (const { value, locale } of jsons) {
                    const json = getNestedObject(value, [...check])
                    if (Object.keys(b).length === 0) {
                        for (const k in json) b[k] = typeof json[k]
                    } else
                        for (const k in json)
                            if (typeof json[k] !== typeof b[k]) {
                                console.error(
                                    `\x1b[31mERROR:\x1b[0m: key \x1b[32m"${[...check, key].join('.')}"\x1b[0m type don't match in \x1b[32m"${locale}.json"\x1b[0m`,
                                )
                                process.exit(1)
                            }
                }
            }
        }
    }
    return [type + ' '.repeat(tab - 2) + '}', object + ' '.repeat(tab - 2) + '}']
}

/**
 * Get nested object
 * @param {{[key:string]:string}} nestedObj
 * @param {string[]} pathArr
 * @returns {{[key:string]:string}}
 */
function getNestedObject(nestedObj, pathArr) {
    return pathArr.reduce((obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined), nestedObj)
}


// the following code was taken from the just library under the MIT license
// see: https://github.com/angus-c/just/tree/d8c5dd18941062d8db7e9310ecc8f53fd607df54
function merge(/* obj1, obj2, [objn] */) {
    let args = [].slice.call(arguments);
    let arg;
    let i = args.length;
    while (((arg = args[i - 1]), i--)) {
      if (!arg || (typeof arg != 'object' && typeof arg != 'function')) {
        throw new Error('expected object, got ' + arg);
      }
    }
    let result = args[0];
    let extenders = args.slice(1);
    let len = extenders.length;
    for (let i = 0; i < len; i++) {
      let extender = extenders[i];
      for (let key in extender) {
        result[key] = extender[key];
      }
    }
    return result;
  }