# underhill

An opinionated wrapper of [tsquery](https://github.com/phenomnomnominal/tsquery) and some other things. Very early in prototyping so everything is likely to change! :surfer:

## Examples

```typescript
import * as path from 'path'
import { SourceCode } from 'underhill'

let example = SourceCode.fromFile(path.join(__dirname, 'example.ts'))

example.modifyParent({
    selector: 'InterfaceDeclaration > Identifier[name!=/[I][A-Z].*/]',
    action: o =>
        o.members.push(
            SourceCode.extractFirst(
                'PropertySignature',
                `
                interface __ {
                    readonly testProperty: boolean
                }
                `
            )
        ),
})

example.modifyParent({
    selector: 'Identifier[name=defaultState]',
    action: o =>
        o.initializer.properties.push(
            SourceCode.extractFirst(
                'PropertyAssignment',
                `
                const __ = {
                    testProperty: false
                }
                `
            )
        ),
})

example.logDiff()

example.writeToFile(path.join(__dirname, 'output.ts'))
```

```typescript
let files = await SourceCode.searchFiles(path.join(__dirname, 'my-project'), {
    selector: 'CallExpression[expression.text=getDefault]',
})

files.forEach(f => {
    console.log('\n' + f.path)
    console.log(f.summary.join('\n---\n'))
})
```
