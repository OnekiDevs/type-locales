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

i18n es una herramienta maravillosa, pero tiene un problema, las frases a traducir se manejan en ficheros externos y estaticos, lo que facilita muchas cosas menos el DX a la hora de intentar recordar las claves y sus parametros a remplazar. Esta herramienta revisa todos tus ficheros json y genera un objeto tipado el cual podras importar para usar el autocompletado y asi no tener que recordar y revisar los ficheros de traduccion.

## The cli

La mayor magia de esta herramienta se encuentra en su cli, que es con el que podras generar el codigo necesario para poder tener el maravilloso autocompletado por tipos.

puedes usar `npx type-locales --help` para ver la ayuda
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
Especifica la ruta de los ficheros json

### -o --output
Especifica el fichero de salida `-o src/keys.ts`, por defecto lo genera en `./locales.ts`

### -l --lang
Especifica el lenguaje que generara, entre json, js y ts, por defecto es ts
por ejemplo, si tu proyecto no usa typescript, puede generar un fichero js con `-l js`. La herramienta se encargara de tiparlo usando JSDoc

### -m --mapping
Genera el mapping para utilizar el metodo `Translator`. Por defecto esta activado para mejorar el DX con los utils, pero se puede desactivar si no pretendes usar tus propios metodos o los nativos de i18n con `-m false`

### -i --indent
Cambia la indentacion del fichero generado con `-i 4` por ejemplo, por defecto esta en 2

### --semi
Activa o desactiva el uso del `;` en el fichero generado, por defecto esta desactivado

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