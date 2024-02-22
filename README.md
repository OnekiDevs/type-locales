# Type Locales

A simple tool for typing your locales and a util for easy manage of i18n with typescript

If you have the following structure
```
.
├── locales
│   ├── en.json
│   └── es.json
└── src
│   └── ...
└── package.json
```
Just run the tool 
```sh
npx type-locales ./locales -o src/locales.ts
```

and it will generate a locales.ts file with the keys that you can use on your i18n with intelisence autocomplete
```
.
├── locales
│   ├── en.json
│   └── es.json
└── src
│   ├── locales.ts
│   └── ...
└── package.json
```

## An example using i18n vanilla
```ts
// src/index.ts
import keys from './locales.js'
import i18n from 'i18n'

i18n.configure({...})

console.log(
    i18n.__mf({ 
        locale: 'en',
        phrase: keys.say.hello
    }, {
        to: 'Jonh Doe'
    })
)
```

An example using type-locales utils

```ts
// src/index.ts
import keys, { 
    LocalesMap // only with the cli option -m
} from './locales.js'
import Translator from 'type-locales'
import i18n from 'i18n'

i18n.configure({...})

const translator = Translate('en')
console.log(
    tanslator(keys.say.hello, { 
        to: 'Jonh Doe' 
    })
)
```

## Why?
i18n is a wonderful tool, but it has a problem, the phrases to translate are handled in external and static files, which makes it easy to do many things except the DX when trying to remember the keys and their parameters to replace. This tool checks all your json files and generates a typed object which you can import to use the autocomplete so you don't have to remember and check the translation files.

## The cli
The biggest magic of this tool is in its cli, which is where you can generate the code needed to have the wonderful type autocompletion.

You can use `npx type-locals --help` to see the help
```sh
Usage: type-locales [path] [options]

Arguments:
  path                   path to translate

Options:
  -V, --version          output the version number
  -o, --output <output>  set output file (default: "./locales")
  -l, --lang <lang>      set lang: ts, js o json (default: "ts")
  -m, --mapping          create a mapping for utils (default: true)
  -i, --indent <number>  set indent (default: "2")
  --semi <semi>          use semi (default: false)
  --no-typing            export without typing
  -q, --quiet            quiet mode (default: false)
  -s, --strict           strict mode, check if the files are complet (default: true)
  -r, --recursive        recursive mode in the folder (default: false)
  -D, --development      development mode, does not generate code for production (default: false)
  -h, --help             display help for command
```

### \[path\]
Specifies the path to the json files

### -o --output
Specifies the output file `-or src/keys.ts`, by default it is generated in `./locals.ts`.

### -l --lang
Specifies the language to generate, between json, js and ts, by default it is ts
for example, if your project does not use typescript, you can generate a js file with `-l js`. The tool will take care of typing it using JSDoc

### -m --mapping
Generates the mapping to use the `Translator` method. By default this is enabled to improve DX with utils, but you can disable it if you don't intend to use your own or i18n native methods with `-m false`.

### -i --indent
Change the indentation of the generated file with `-i 4` for example, by default it is set to 2

### --semi
Enables or disables the use of `;` in the generated file, by default it is disabled.

### --no-typing
Compatible con `-l ts` y `-l js`, omite la creacion de tipos y genera solo el objeto con las keys disponibles. No es compatible con la opcion `--strict`

### -q --quiet
Corre el comando sin outputs, por defecto es false

### -s --strict
Si alguna key no esta presente en todos los ficheros, el tipo lo generara como opcional para remarcarlo al compilar y evitar missing keys. Por defecto esta activo y no es compatible con la opcion `--no-typing`

### -r --recursive
Busca en todos los subdirectorios de la ruta especificada, por defecto esta desactivado

### -D --development
Activa el modo desarrollo, omite las opciones `-l`, `-s`, `-m`, `-o` y `--no-typing`, no genera ningun fichero visible pero carga internamente los tipos para poder usarlos con el util `Translator` sin tener que pasarle el tipo manualmente.

```ts
// src/index.ts
import Translator from 'type-locales'
import i18n from 'i18n'

i18n.configure({...})

const translator = Translate('en')
console.log( // has autocomplete without keys
    tanslator('say.hello', { 
        to: 'Jonh Doe' 
    })
)
```