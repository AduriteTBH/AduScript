# AduScript Language Specification (v1.0)
**File Extension:** `.ads`  
**Target Output:** Clean, Source-Mapped ECMAScript 2024+ (ES Modules)  
**Execution Environments:** Modern Web Browsers (Chrome 90+, Safari 15+, Firefox 90+, Edge), Node.js (18+), Deno, Bun.

---

## 1. Design Philosophy

AduScript is engineered from first principles to eliminate boilerplate in web application development, streamline data transformations, provide first-class reactive state primitives, and offer zero-friction interop with the broader JavaScript ecosystem.

### Core Tenets:
1. **Immutability by Default:** Declarations use `let` for immutable bindings (compiling to `const`) and `mut` for explicitly mutable variables (compiling to `let`).
2. **First-Class Pipeline Operator (`|>`)**: Clean left-to-right functional data transformations without nested parentheses or temporary variables.
3. **Pattern Matching (`match ... with`)**: Expressive, exhaustible pattern matching construct replacing verbose `switch` and fragile `if-else` ladders.
4. **Zero-Boilerplate CDN / Module Interop (`use`)**: Native syntax for pulling CDN modules (e.g. Three.js, GSAP, Pixi.js) and standard ES modules directly into scope.
5. **Built-in Reactivity (`state`, `watch`, `effect`)**: Native reactive state primitives that automatically track dependencies and dispatch reactions on mutation.
6. **Zero Runtime Overhead & 100% JS Interop**: Direct access to browser globals (`document`, `window`, `Math`, `fetch`, `requestAnimationFrame`, etc.) without wrapper abstractions.

---

## 2. Lexical Grammar

### 2.1 Character Set & Whitespace
* Source files are encoded in **UTF-8**.
* Whitespace (spaces, tabs, newlines) acts as token separators except inside string literals.
* Semicolons are **optional**; newlines and delimiters automatically terminate statements where unambiguous.

### 2.2 Comments
* Single-line comments: `// text`
* Multi-line comments: `/* text */`
* Doc comments: `/// markdown documentation`

### 2.3 Identifiers
* Valid identifiers match `[a-zA-Z_$][a-zA-Z0-9_$]*`.
* Underscore `_` can be used as a wildcard or pipeline placeholder.

### 2.4 Keywords
`let`, `mut`, `state`, `fn`, `async`, `await`, `use`, `import`, `export`, `from`, `as`, `match`, `with`, `if`, `else`, `for`, `in`, `while`, `return`, `watch`, `effect`, `true`, `false`, `null`, `undefined`, `new`, `typeof`, `instanceof`, `try`, `catch`, `finally`, `throw`, `break`, `continue`.

### 2.5 Operators & Punctuation
* Pipeline: `|>`
* Arrows: `->` (expression function/closure), `=>` (match arm / fat arrow)
* Range: `..` (e.g. `0..10`)
* Optional Chaining: `?.`
* Nullish Coalescing: `??`
* Spread/Rest: `...`
* Arithmetic: `+`, `-`, `*`, `/`, `%`, `**`
* Assignment: `=`, `+=`, `-=`, `*=`, `/=`, `%=`
* Comparison: `==`, `!=`, `===`, `!==`, `<`, `<=`, `>`, `>=`
* Logical: `&&`, `||`, `!`
* Delimiters: `(`, `)`, `[`, `]`, `{`, `}`, `,`, `:`, `;`, `.`

### 2.6 Literals
* **Numbers:** Decimal (`42`, `3.14159`), Hexadecimal (`0xFF`), Binary (`0b1010`), Scientific (`1e-5`).
* **Strings:**
  - Double/single quotes: `"Hello, World"`, `'AduScript'`
  - Formatted String Interpolation: `f"Count is {count + 1}"`
  - Template literals: `` `Value: ${val}` ``
* **Booleans:** `true`, `false`
* **Nullish:** `null`, `undefined`
* **Arrays & Objects:** `[1, 2, 3]`, `{ name: "Adu", count: 42 }`

---

## 3. Formal Syntax Grammar (EBNF)

```ebnf
Program ::= ( Statement )* EOF

Statement ::= VariableDecl
            | StateDecl
            | FunctionDecl
            | UseDecl
            | ImportDecl
            | ExportDecl
            | IfStatement
            | MatchStatement
            | ForStatement
            | WhileStatement
            | ReturnStatement
            | WatchStatement
            | EffectStatement
            | ExpressionStatement
            | BlockStatement

VariableDecl ::= ( "let" | "mut" ) Pattern ( "=" Expression )? ";"?
StateDecl    ::= "state" Identifier "=" Expression ";"?

UseDecl      ::= "use" ( CDN_Specifier | StringLiteral ) ( "as" Identifier )? ( ImportSpecifiers )? ";"?
CDN_Specifier ::= "cdn:" Identifier ( "@" Version )? ( "/" Path )?

ImportDecl   ::= "import" ( ( Identifier | ImportSpecifiers ) "from" )? StringLiteral ";"?
ExportDecl   ::= "export" ( "default" )? ( VariableDecl | FunctionDecl | Identifier | ExportSpecifiers ) ";"?

FunctionDecl ::= ( "async" )? "fn" Identifier "(" ParameterList? ")" ( "->" Expression | BlockStatement )

ParameterList ::= Parameter ( "," Parameter )*
Parameter     ::= Identifier ( "=" Expression )? | "..." Identifier

BlockStatement ::= "{" ( Statement )* "}"

IfStatement ::= "if" "("? Expression ")"? Statement ( "else" Statement )?

MatchStatement ::= "match" Expression "with" "{"? ( MatchArm ( "," | ";" )? )* "}"?
MatchArm       ::= Pattern ( "if" Expression )? "=>" ( Expression | BlockStatement )

ForStatement   ::= "for" ( "let" | "mut" )? ( Identifier | Pattern ) "in" Expression Statement
WhileStatement ::= "while" "("? Expression ")"? Statement

ReturnStatement ::= "return" Expression? ";"?
WatchStatement  ::= "watch" Expression "=>" ( Expression | BlockStatement )
EffectStatement ::= "effect" BlockStatement

ExpressionStatement ::= Expression ";"?

Expression ::= PipelineExpr

PipelineExpr ::= LogicalOrExpr ( "|>" ( PipelineTarget ) )*
PipelineTarget ::= Identifier
                 | CallExpression
                 | MethodCallShorthand
                 | PlaceholderExpression

MethodCallShorthand ::= "." Identifier "(" ArgumentList? ")"
PlaceholderExpression ::= Expression (containing "_" as argument)

LogicalOrExpr  ::= LogicalAndExpr ( "||" LogicalAndExpr )*
LogicalAndExpr ::= EqualityExpr ( "&&" EqualityExpr )*
EqualityExpr   ::= RelationalExpr ( ( "==" | "!=" | "===" | "!==" ) RelationalExpr )*
RelationalExpr ::= RangeExpr ( ( "<" | "<=" | ">" | ">=" | "instanceof" | "in" ) RangeExpr )*
RangeExpr      ::= AdditiveExpr ( ".." AdditiveExpr )?
AdditiveExpr   ::= MultiplicativeExpr ( ( "+" | "-" ) MultiplicativeExpr )*
MultiplicativeExpr ::= PowerExpr ( ( "*" | "/" | "%" ) PowerExpr )*
PowerExpr      ::= UnaryExpr ( "**" PowerExpr )?
UnaryExpr      ::= ( "!" | "-" | "+" | "typeof" | "await" ) UnaryExpr | PostfixExpr

PostfixExpr    ::= PrimaryExpr ( MemberAccess | CallAccess | OptionalMemberAccess )*
MemberAccess   ::= "." Identifier | "[" Expression "]"
CallAccess     ::= "(" ArgumentList? ")"
OptionalMemberAccess ::= "?." Identifier | "?." "(" ArgumentList? ")" | "?." "[" Expression "]"

PrimaryExpr ::= Identifier
              | NumberLiteral
              | StringLiteral
              | FormattedStringLiteral
              | BooleanLiteral
              | "null" | "undefined"
              | ArrayLiteral
              | ObjectLiteral
              | ClosureExpr
              | MatchExpression
              | ParenthesizedExpr

ClosureExpr ::= ( "async" )? ( "(" ParameterList? ")" | Identifier ) ( "->" Expression | "=>" ( Expression | BlockStatement ) )
MatchExpression ::= "match" Expression "with" "{"? ( MatchArm ( "," | ";" )? )* "}"?
```

---

## 4. Key Language Semantics

### 4.1 Declarations & Immutability
```aduscript
let a = 10;        // Transpiles to: const a = 10;
mut counter = 0;   // Transpiles to: let counter = 0;
counter += 1;
```

### 4.2 Single-Expression & Multi-Line Functions
```aduscript
// Auto-returning expression function
fn add(a, b) -> a + b

// Multi-statement block function
fn process(items) {
  let filtered = items.filter(x -> x > 0)
  return filtered.reduce((acc, x) -> acc + x, 0)
}

// Async expression function
async fn fetchUser(id) -> await fetch(f"/api/users/{id}").then(r -> r.json())
```

### 4.3 Pipeline Operator (`|>`)
The pipeline operator feeds the left-hand expression into the right-hand function or call:

1. **Direct Function Pipe:**
   ```aduscript
   data |> sanitize |> process |> display
   // Transpiles to: display(process(sanitize(data)))
   ```

2. **Call with Implicit First Argument:**
   ```aduscript
   numbers |> filter(isEven) |> map(square)
   // Transpiles to: map(filter(numbers, isEven), square)
   ```

3. **Call with Explicit Placeholder (`_`):**
   ```aduscript
   5 |> Math.pow(2, _)
   // Transpiles to: Math.pow(2, 5)
   ```

4. **Method Pipeline Shorthand:**
   ```aduscript
   "  hello world  " |> .trim() |> .toUpperCase()
   // Transpiles to: "  hello world  ".trim().toUpperCase()
   ```

### 4.4 Pattern Matching (`match ... with`)
```aduscript
let description = match response with
  { status: 200, data } => f"Success: {data.length} items",
  { status: 404 }       => "Resource Not Found",
  { status: s } if s >= 500 => f"Server Error {s}",
  [first, ...rest]      => f"List starting with {first}",
  1..10                 => "Small range number",
  _                     => "Unknown response"
```

### 4.5 Zero-Boilerplate CDN Imports (`use`)
AduScript resolves CDNs intelligently via ESM registries:
```aduscript
use cdn:three as THREE
use cdn:gsap as gsap
use "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/+esm" as confetti

// Shorthand named imports from CDN:
use cdn:three { Scene, PerspectiveCamera, WebGLRenderer, Mesh, BoxGeometry, MeshStandardMaterial }
```

Transpiles to:
```javascript
import * as THREE from "https://esm.sh/three";
import gsap from "https://esm.sh/gsap";
import confetti from "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/+esm";
import { Scene, PerspectiveCamera, WebGLRenderer, Mesh, BoxGeometry, MeshStandardMaterial } from "https://esm.sh/three";
```

### 4.6 Reactive State Primitives
```aduscript
state count = 0
state user = { name: "Haris", online: true }

watch count => {
  console.log(f"Counter mutated: {count.value}")
}

effect {
  document.title = f"App ({count.value} clicks)"
}

// In event handler:
button.addEventListener("click", () -> count.value += 1)
```

Transpiles to:
```javascript
const count = $adu.state(0);
const user = $adu.state({ name: "Haris", online: true });

$adu.watch(count, () => {
  console.log(`Counter mutated: ${count.value}`);
});

$adu.effect(() => {
  document.title = `App (${count.value} clicks)`;
});

button.addEventListener("click", () -> count.value += 1);
```

### 4.7 HTML, CSS & Subfolder Modularity
AduScript seamlessly interoperates with HTML and CSS and resolves modules across directory hierarchies:

1. **Relative Cross-Subfolder Imports:**
   ```aduscript
   import "./styles/theme.css"
   import { Header } from "./components/header.ads"
   import { calculateStats } from "../utils/math.ads"
   ```

2. **Reactive HTML Templates (`$adu.html`):**
   ```aduscript
   let view = $adu.html`
     <div class="card">
       <h2>${title.value}</h2>
       <button onclick=${() -> count.value += 1}>Clicks: ${count.value}</button>
     </div>
   `
   ```

3. **CSS Injection (`$adu.css`):**
   ```aduscript
   $adu.css`
     .card { background: #12141e; padding: 24px; border-radius: 12px; }
   `
   ```

4. **Reactive DOM Mounting (`$adu.mount`):**
   ```aduscript
   $adu.mount("#app", renderApp)
   ```

---

## 5. Error Handling & Diagnostics

AduScript features human-friendly compiler diagnostic messages pinpointing source code line, column, and visual caret markers:

```
[AduScript Syntax Error] Unexpected token '}' at line 14, column 5
  12 |   let x = 10
  13 |   let y = 20
  14 |     }
     |     ^
Expected an expression or statement closing.
```
