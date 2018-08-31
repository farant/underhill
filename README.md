# underhill

## Example

```
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
