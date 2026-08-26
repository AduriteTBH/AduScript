/**
 * AduScript Compiler - Code Generator & Source Map Generator
 * Deliverable C: Emits clean, readable ECMAScript 2024+ from the AduScript AST.
 */

import { ASTNodeType } from './ast.js';
import { resolveCDN } from './runtime.js';

export class CodeGenerator {
  constructor(options = {}) {
    this.options = Object.assign({
      moduleType: 'esm', // 'esm' | 'inline-runtime' | 'cjs'
      runtimePath: './runtime.js',
      includeSourceMap: false,
      sourceFileName: 'source.ads',
      indentSize: 2
    }, options);

    this.indentation = 0;
    this.output = [];
    this.neededRuntimeHelpers = new Set();
    this.hasState = false;
    this.hasWatch = false;
    this.hasEffect = false;
    this.hasMatch = false;
    this.hasRange = false;
  }

  static generate(ast, options = {}) {
    const codegen = new CodeGenerator(options);
    return codegen.generateProgram(ast);
  }

  indent() {
    return ' '.repeat(this.indentation * this.options.indentSize);
  }

  emit(str) {
    this.output.push(str);
  }

  emitLine(str = '') {
    this.output.push(this.indent() + str + '\n');
  }

  generateProgram(node) {
    this.output = [];
    
    // First pass: inspect node to see if runtime helpers are required
    this.inspectNodeForHelpers(node);

    // Header / Runtime Imports
    if (this.options.moduleType === 'inline-runtime') {
      // Inlined runtime helper definition for single standalone browser execution
      this.emitLine(`// --- AduScript Inlined Runtime ($adu) ---`);
      this.emitLine(this.getInlinedRuntimeCode());
      this.emitLine();
    } else if (this.options.moduleType === 'esm' && this.needsAduRuntime()) {
      this.emitLine(`import { $adu } from "${this.options.runtimePath}";`);
      this.emitLine();
    }

    // Emit all statements
    for (const stmt of node.body) {
      this.generateStatement(stmt);
    }

    const code = this.output.join('');
    return {
      code,
      map: this.options.includeSourceMap ? this.generateSourceMap(code) : null
    };
  }

  needsAduRuntime() {
    return this.hasState || this.hasWatch || this.hasEffect || this.hasMatch || this.hasRange;
  }

  inspectNodeForHelpers(node) {
    if (!node || typeof node !== 'object') return;
    switch (node.type) {
      case ASTNodeType.STATE_DECLARATION:
        this.hasState = true;
        break;
      case ASTNodeType.WATCH_STATEMENT:
        this.hasWatch = true;
        break;
      case ASTNodeType.EFFECT_STATEMENT:
        this.hasEffect = true;
        break;
      case ASTNodeType.MATCH_EXPRESSION:
      case ASTNodeType.MATCH_STATEMENT:
        this.hasMatch = true;
        break;
      case ASTNodeType.RANGE_EXPRESSION:
        this.hasRange = true;
        break;
      case ASTNodeType.FOR_STATEMENT:
        if (node.iterable && node.iterable.type === ASTNodeType.RANGE_EXPRESSION) {
          this.hasRange = true;
        }
        break;
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) this.inspectNodeForHelpers(c);
      } else if (child && typeof child === 'object') {
        this.inspectNodeForHelpers(child);
      }
    }
  }

  generateStatement(node) {
    if (!node) return;

    switch (node.type) {
      case ASTNodeType.VARIABLE_DECLARATION:
        this.generateVariableDeclaration(node);
        break;
      case ASTNodeType.STATE_DECLARATION:
        this.generateStateDeclaration(node);
        break;
      case ASTNodeType.FUNCTION_DECLARATION:
        this.generateFunctionDeclaration(node);
        break;
      case ASTNodeType.USE_DECLARATION:
        this.generateUseDeclaration(node);
        break;
      case ASTNodeType.IMPORT_DECLARATION:
        this.generateImportDeclaration(node);
        break;
      case ASTNodeType.EXPORT_DECLARATION:
        this.generateExportDeclaration(node);
        break;
      case ASTNodeType.IF_STATEMENT:
        this.generateIfStatement(node);
        break;
      case ASTNodeType.MATCH_STATEMENT:
        this.generateMatchStatement(node);
        break;
      case ASTNodeType.FOR_STATEMENT:
        this.generateForStatement(node);
        break;
      case ASTNodeType.WHILE_STATEMENT:
        this.generateWhileStatement(node);
        break;
      case ASTNodeType.RETURN_STATEMENT:
        this.generateReturnStatement(node);
        break;
      case ASTNodeType.WATCH_STATEMENT:
        this.generateWatchStatement(node);
        break;
      case ASTNodeType.EFFECT_STATEMENT:
        this.generateEffectStatement(node);
        break;
      case ASTNodeType.TRY_STATEMENT:
        this.generateTryStatement(node);
        break;
      case ASTNodeType.THROW_STATEMENT:
        this.emitLine(`throw ${this.generateExpression(node.argument)};`);
        break;
      case ASTNodeType.BREAK_STATEMENT:
        this.emitLine('break;');
        break;
      case ASTNodeType.CONTINUE_STATEMENT:
        this.emitLine('continue;');
        break;
      case ASTNodeType.BLOCK_STATEMENT:
        this.generateBlockStatement(node);
        break;
      case ASTNodeType.EXPRESSION_STATEMENT:
        this.emitLine(`${this.generateExpression(node.expression)};`);
        break;
      default:
        throw new Error(`Unsupported statement AST node: ${node.type}`);
    }
  }

  generateVariableDeclaration(node) {
    const jsKind = node.kind === 'let' ? 'const' : 'let';
    const pattern = this.generatePattern(node.pattern);
    if (node.init) {
      const init = this.generateExpression(node.init);
      this.emitLine(`${jsKind} ${pattern} = ${init};`);
    } else {
      this.emitLine(`${jsKind} ${pattern};`);
    }
  }

  generateStateDeclaration(node) {
    const id = node.id.name;
    const init = this.generateExpression(node.init);
    this.emitLine(`const ${id} = $adu.state(${init});`);
  }

  generateFunctionDeclaration(node) {
    const asyncPrefix = node.isAsync ? 'async ' : '';
    const name = node.id.name;
    const params = node.params.map(p => this.generatePattern(p)).join(', ');

    if (node.isExpressionBody) {
      const bodyExpr = this.generateExpression(node.body);
      this.emitLine(`${asyncPrefix}function ${name}(${params}) {`);
      this.indentation++;
      this.emitLine(`return ${bodyExpr};`);
      this.indentation--;
      this.emitLine(`}`);
    } else {
      this.emitLine(`${asyncPrefix}function ${name}(${params}) {`);
      this.indentation++;
      if (node.body && node.body.body) {
        for (const stmt of node.body.body) {
          this.generateStatement(stmt);
        }
      }
      this.indentation--;
      this.emitLine(`}`);
    }
  }

  generateUseDeclaration(node) {
    const url = resolveCDN(node.source);
    if (node.alias) {
      // use cdn:three as THREE -> import * as THREE from "..."
      this.emitLine(`import * as ${node.alias} from "${url}";`);
    } else if (node.specifiers && node.specifiers.length > 0) {
      // use cdn:three { Scene, Camera } -> import { Scene, Camera } from "..."
      const specs = node.specifiers.map(s => s.local !== s.imported ? `${s.imported} as ${s.local}` : s.imported).join(', ');
      this.emitLine(`import { ${specs} } from "${url}";`);
    } else {
      // Bare use "https://..."
      this.emitLine(`import "${url}";`);
    }
  }

  generateImportDeclaration(node) {
    let source = node.source;
    if (this.options.rewriteAdsImports && source.endsWith('.ads')) {
      source = source.replace(/\.ads$/, '.js');
    }

    if (source.endsWith('.css') && this.options.moduleType === 'inline-runtime') {
      this.emitLine(`if (typeof document !== 'undefined') { const _l = document.createElement('link'); _l.rel = 'stylesheet'; _l.href = "${source}"; document.head.appendChild(_l); }`);
      return;
    }

    let parts = [];
    if (node.defaultImport) {
      parts.push(node.defaultImport);
    }
    if (node.specifiers && node.specifiers.length > 0) {
      const specs = node.specifiers.map(s => s.local !== s.imported ? `${s.imported} as ${s.local}` : s.imported).join(', ');
      parts.push(`{ ${specs} }`);
    }
    if (parts.length > 0) {
      this.emitLine(`import ${parts.join(', ')} from "${source}";`);
    } else {
      this.emitLine(`import "${source}";`);
    }
  }

  generateExportDeclaration(node) {
    if (node.isDefault) {
      this.emitLine(`export default ${this.generateExpression(node.declaration)};`);
    } else if (node.declaration) {
      this.emit(`${this.indent()}export `);
      // Strip indentation for inline declaration
      const prevIndent = this.indentation;
      this.indentation = 0;
      if (node.declaration.type === ASTNodeType.VARIABLE_DECLARATION) {
        const jsKind = node.declaration.kind === 'let' ? 'const' : 'let';
        const pattern = this.generatePattern(node.declaration.pattern);
        const init = node.declaration.init ? ` = ${this.generateExpression(node.declaration.init)}` : '';
        this.emit(`${jsKind} ${pattern}${init};\n`);
      } else if (node.declaration.type === ASTNodeType.FUNCTION_DECLARATION) {
        const asyncPrefix = node.declaration.isAsync ? 'async ' : '';
        const name = node.declaration.id.name;
        const params = node.declaration.params.map(p => this.generatePattern(p)).join(', ');
        this.emit(`${asyncPrefix}function ${name}(${params}) `);
        this.indentation = prevIndent;
        if (node.declaration.isExpressionBody) {
          this.emit(`{\n`);
          this.indentation++;
          this.emitLine(`return ${this.generateExpression(node.declaration.body)};`);
          this.indentation--;
          this.emitLine(`}`);
        } else {
          this.emit(`{\n`);
          this.indentation++;
          for (const stmt of node.declaration.body.body) {
            this.generateStatement(stmt);
          }
          this.indentation--;
          this.emitLine(`}`);
        }
      }
      this.indentation = prevIndent;
    } else if (node.specifiers && node.specifiers.length > 0) {
      const specs = node.specifiers.map(s => s.local !== s.exported ? `${s.local} as ${s.exported}` : s.local).join(', ');
      this.emitLine(`export { ${specs} };`);
    }
  }

  generateIfStatement(node) {
    const test = this.generateExpression(node.test);
    this.emitLine(`if (${test}) {`);
    this.indentation++;
    if (node.consequent.type === ASTNodeType.BLOCK_STATEMENT) {
      for (const stmt of node.consequent.body) this.generateStatement(stmt);
    } else {
      this.generateStatement(node.consequent);
    }
    this.indentation--;

    if (node.alternate) {
      if (node.alternate.type === ASTNodeType.IF_STATEMENT) {
        this.emit(`${this.indent()}} else `);
        // Clean else-if
        this.output.pop(); // remove extra newline
        this.output.push('} else ');
        this.generateIfStatement(node.alternate);
        return;
      } else {
        this.emitLine(`} else {`);
        this.indentation++;
        if (node.alternate.type === ASTNodeType.BLOCK_STATEMENT) {
          for (const stmt of node.alternate.body) this.generateStatement(stmt);
        } else {
          this.generateStatement(node.alternate);
        }
        this.indentation--;
      }
    }
    this.emitLine(`}`);
  }

  generateMatchStatement(node) {
    const expr = this.generateMatchExpression(node);
    this.emitLine(`${expr};`);
  }

  generateForStatement(node) {
    const variable = this.generatePattern(node.variable);
    const kind = node.kind === 'mut' ? 'let' : 'const';

    // Check if range: for i in 0..10
    if (node.iterable.type === ASTNodeType.RANGE_EXPRESSION) {
      const start = this.generateExpression(node.iterable.start);
      const end = this.generateExpression(node.iterable.end);
      this.emitLine(`for (${kind} ${variable} of $adu.range(${start}, ${end})) {`);
    } else {
      const iterable = this.generateExpression(node.iterable);
      this.emitLine(`for (${kind} ${variable} of ${iterable}) {`);
    }

    this.indentation++;
    if (node.body.type === ASTNodeType.BLOCK_STATEMENT) {
      for (const stmt of node.body.body) this.generateStatement(stmt);
    } else {
      this.generateStatement(node.body);
    }
    this.indentation--;
    this.emitLine(`}`);
  }

  generateWhileStatement(node) {
    const test = this.generateExpression(node.test);
    this.emitLine(`while (${test}) {`);
    this.indentation++;
    if (node.body.type === ASTNodeType.BLOCK_STATEMENT) {
      for (const stmt of node.body.body) this.generateStatement(stmt);
    } else {
      this.generateStatement(node.body);
    }
    this.indentation--;
    this.emitLine(`}`);
  }

  generateReturnStatement(node) {
    if (node.argument) {
      this.emitLine(`return ${this.generateExpression(node.argument)};`);
    } else {
      this.emitLine(`return;`);
    }
  }

  generateWatchStatement(node) {
    const target = this.generateExpression(node.target);
    if (node.handler.type === ASTNodeType.BLOCK_STATEMENT) {
      this.emitLine(`$adu.watch(${target}, () => {`);
      this.indentation++;
      for (const stmt of node.handler.body) this.generateStatement(stmt);
      this.indentation--;
      this.emitLine(`});`);
    } else {
      const handlerExpr = this.generateExpression(node.handler);
      this.emitLine(`$adu.watch(${target}, ${handlerExpr});`);
    }
  }

  generateEffectStatement(node) {
    this.emitLine(`$adu.effect(() => {`);
    this.indentation++;
    if (node.body && node.body.body) {
      for (const stmt of node.body.body) this.generateStatement(stmt);
    }
    this.indentation--;
    this.emitLine(`});`);
  }

  generateTryStatement(node) {
    this.emitLine(`try {`);
    this.indentation++;
    for (const stmt of node.block.body) this.generateStatement(stmt);
    this.indentation--;

    if (node.handlerBody) {
      const param = node.handlerParam ? this.generatePattern(node.handlerParam) : 'error';
      this.emitLine(`} catch (${param}) {`);
      this.indentation++;
      for (const stmt of node.handlerBody.body) this.generateStatement(stmt);
      this.indentation--;
    }

    if (node.finalizer) {
      this.emitLine(`} finally {`);
      this.indentation++;
      for (const stmt of node.finalizer.body) this.generateStatement(stmt);
      this.indentation--;
    }

    this.emitLine(`}`);
  }

  generateBlockStatement(node) {
    this.emitLine(`{`);
    this.indentation++;
    for (const stmt of node.body) this.generateStatement(stmt);
    this.indentation--;
    this.emitLine(`}`);
  }

  // --- PATTERNS ---

  generatePattern(node) {
    if (!node) return '';
    switch (node.type) {
      case ASTNodeType.IDENTIFIER:
        return node.name;
      case ASTNodeType.WILDCARD_PATTERN:
        return '_';
      case ASTNodeType.LITERAL:
        return typeof node.value === 'string' ? JSON.stringify(node.value) : String(node.value);
      case ASTNodeType.ARRAY_LITERAL:
        return `[${node.elements.map(e => this.generatePattern(e)).join(', ')}]`;
      case ASTNodeType.OBJECT_LITERAL:
        return `{ ${node.properties.map(p => {
          if (p.type === ASTNodeType.SPREAD_ELEMENT) return `...${this.generatePattern(p.argument)}`;
          return p.shorthand ? p.key.name : `${p.key.name}: ${this.generatePattern(p.value)}`;
        }).join(', ')} }`;
      case ASTNodeType.SPREAD_ELEMENT:
        return `...${this.generatePattern(node.argument)}`;
      case ASTNodeType.ASSIGNMENT_EXPRESSION:
        return `${this.generatePattern(node.left)} = ${this.generateExpression(node.right)}`;
      default:
        return this.generateExpression(node);
    }
  }

  // --- EXPRESSIONS ---

  generateExpression(node) {
    if (!node) return '';

    switch (node.type) {
      case ASTNodeType.IDENTIFIER:
        return node.name;

      case ASTNodeType.LITERAL:
        if (node.value === null) return 'null';
        if (node.value === undefined) return 'undefined';
        if (typeof node.value === 'string') return JSON.stringify(node.value);
        return String(node.value);

      case ASTNodeType.FORMATTED_STRING_LITERAL:
        return this.generateFormattedString(node);

      case ASTNodeType.TAGGED_TEMPLATE_EXPRESSION:
        return `${this.generateExpression(node.tag)}${this.generateExpression(node.quasi)}`;

      case ASTNodeType.TEMPLATE_LITERAL:
        return this.generateTemplateLiteral(node);

      case ASTNodeType.PLACEHOLDER_EXPRESSION:
        return '_';

      case ASTNodeType.BINARY_EXPRESSION:
        return `(${this.generateExpression(node.left)} ${node.operator} ${this.generateExpression(node.right)})`;

      case ASTNodeType.CONDITIONAL_EXPRESSION:
        return `(${this.generateExpression(node.test)} ? ${this.generateExpression(node.consequent)} : ${this.generateExpression(node.alternate)})`;

      case ASTNodeType.UNARY_EXPRESSION:
        return `${node.operator === 'typeof' ? 'typeof ' : node.operator}${this.generateExpression(node.argument)}`;

      case ASTNodeType.AWAIT_EXPRESSION:
        return `await ${this.generateExpression(node.argument)}`;

      case ASTNodeType.RANGE_EXPRESSION:
        return `$adu.range(${this.generateExpression(node.start)}, ${this.generateExpression(node.end)})`;

      case ASTNodeType.PIPELINE_EXPRESSION:
        return this.generatePipelineExpression(node);

      case ASTNodeType.MATCH_EXPRESSION:
        return this.generateMatchExpression(node);

      case ASTNodeType.CALL_EXPRESSION:
        return this.generateCallExpression(node);

      case ASTNodeType.MEMBER_EXPRESSION:
        if (node.computed) {
          return `${this.generateExpression(node.object)}[${this.generateExpression(node.property)}]`;
        }
        return `${this.generateExpression(node.object)}${node.optional ? '?.' : '.'}${node.property.name}`;

      case ASTNodeType.ASSIGNMENT_EXPRESSION:
        return `${this.generatePattern(node.left)} ${node.operator} ${this.generateExpression(node.right)}`;

      case ASTNodeType.CLOSURE_EXPRESSION:
        return this.generateClosureExpression(node);

      case ASTNodeType.ARRAY_LITERAL:
        return `[${node.elements.map(e => this.generateExpression(e)).join(', ')}]`;

      case ASTNodeType.OBJECT_LITERAL:
        return this.generateObjectLiteral(node);

      case ASTNodeType.SPREAD_ELEMENT:
        return `...${this.generateExpression(node.argument)}`;

      case ASTNodeType.NEW_EXPRESSION:
        const newArgs = node.arguments.map(a => this.generateExpression(a)).join(', ');
        return `new ${this.generateExpression(node.callee)}(${newArgs})`;

      default:
        throw new Error(`Unsupported expression AST node: ${node.type}`);
    }
  }

  generateFormattedString(node) {
    let result = '`';
    for (const part of node.parts) {
      if (part.type === 'string') {
        result += part.value.replace(/`/g, '\\`').replace(/\${/g, '\\${');
      } else if (part.type === 'expression') {
        const expr = part.exprNode ? this.generateExpression(part.exprNode) : part.value;
        result += `\${${expr}}`;
      }
    }
    result += '`';
    return result;
  }

  generateTemplateLiteral(node) {
    let result = '`';
    for (const part of node.parts) {
      if (part.type === 'string') {
        result += part.value.replace(/`/g, '\\`').replace(/\${/g, '\\${');
      } else if (part.type === 'expression') {
        const expr = part.exprNode ? this.generateExpression(part.exprNode) : part.value;
        result += `\${${expr}}`;
      }
    }
    result += '`';
    return result;
  }

  generatePipelineExpression(node) {
    const leftExpr = this.generateExpression(node.left);

    // Case 1: Right is a method shorthand .trim() -> left.trim()
    if (node.right.type === ASTNodeType.CALL_EXPRESSION && node.right.callee.type === ASTNodeType.MEMBER_EXPRESSION && node.right.callee.object.type === ASTNodeType.PLACEHOLDER_EXPRESSION) {
      const methodName = node.right.callee.property.name;
      const args = node.right.arguments.map(a => this.generateExpression(a)).join(', ');
      return `${leftExpr}.${methodName}(${args})`;
    }

    // Case 2: Right is a CallExpression
    if (node.right.type === ASTNodeType.CALL_EXPRESSION) {
      const callee = this.generateExpression(node.right.callee);
      
      // Check if placeholder `_` exists among arguments
      let hasPlaceholder = false;
      const mappedArgs = node.right.arguments.map(arg => {
        if (arg.type === ASTNodeType.PLACEHOLDER_EXPRESSION) {
          hasPlaceholder = true;
          return leftExpr;
        }
        return this.generateExpression(arg);
      });

      if (hasPlaceholder) {
        return `${callee}(${mappedArgs.join(', ')})`;
      } else {
        // Implicit first argument: x |> f(y) -> f(x, y)
        mappedArgs.unshift(leftExpr);
        return `${callee}(${mappedArgs.join(', ')})`;
      }
    }

    // Case 3: Right is a simple Identifier or function reference: x |> f -> f(x)
    const rightExpr = this.generateExpression(node.right);
    return `${rightExpr}(${leftExpr})`;
  }

  generateMatchExpression(node) {
    const target = this.generateExpression(node.discriminant);
    const armObjects = node.arms.map(arm => {
      const testCode = this.generatePatternMatcher(arm.pattern);
      const bindingStr = this.generatePatternBinding(arm.pattern);
      const patternBinding = bindingStr ? `const ${bindingStr} = val; ` : '';

      const guardCode = arm.guard ? `(val) => { try { ${patternBinding}return ${this.generateExpression(arm.guard)}; } catch (_) { return false; } }` : 'null';

      let bodyCode;
      if (arm.body.type === ASTNodeType.BLOCK_STATEMENT) {
        const bodyStmts = arm.body.body.map(s => {
          const cg = new CodeGenerator(this.options);
          cg.generateStatement(s);
          return cg.output.join('');
        }).join('');
        bodyCode = `(val) => {\n${patternBinding ? '  ' + patternBinding + '\n' : ''}${bodyStmts}}`;
      } else {
        if (bindingStr) {
          bodyCode = `(val) => { ${patternBinding}return (${this.generateExpression(arm.body)}); }`;
        } else {
          bodyCode = `(val) => (${this.generateExpression(arm.body)})`;
        }
      }

      return `{ test: ${testCode}, guard: ${guardCode}, body: ${bodyCode} }`;
    });

    return `$adu.match(${target}, [\n  ${armObjects.join(',\n  ')}\n])`;
  }

  generatePatternBinding(pattern) {
    if (!pattern) return '';
    if (pattern.type === ASTNodeType.IDENTIFIER && pattern.name !== '_') {
      return pattern.name;
    }
    if (pattern.type === ASTNodeType.OBJECT_LITERAL) {
      const validProps = [];
      for (const p of pattern.properties) {
        if (p.type === ASTNodeType.SPREAD_ELEMENT) {
          const inner = this.generatePatternBinding(p.argument);
          if (inner) validProps.push(`...${inner}`);
        } else if (p.value.type === ASTNodeType.IDENTIFIER && p.value.name !== '_') {
          const key = p.key.name || p.key.value;
          validProps.push(p.shorthand ? key : `${key}: ${p.value.name}`);
        } else if (p.value.type === ASTNodeType.OBJECT_LITERAL || p.value.type === ASTNodeType.ARRAY_LITERAL) {
          const inner = this.generatePatternBinding(p.value);
          if (inner) {
            const key = p.key.name || p.key.value;
            validProps.push(`${key}: ${inner}`);
          }
        }
      }
      return validProps.length > 0 ? `{ ${validProps.join(', ')} }` : '';
    }
    if (pattern.type === ASTNodeType.ARRAY_LITERAL) {
      const validElems = [];
      let hasBindings = false;
      for (const el of pattern.elements) {
        if (el.type === ASTNodeType.SPREAD_ELEMENT) {
          const inner = this.generatePatternBinding(el.argument);
          if (inner) { validElems.push(`...${inner}`); hasBindings = true; }
        } else if (el.type === ASTNodeType.IDENTIFIER && el.name !== '_') {
          validElems.push(el.name);
          hasBindings = true;
        } else {
          validElems.push('_');
        }
      }
      return hasBindings ? `[${validElems.join(', ')}]` : '';
    }
    return '';
  }

  generatePatternMatcher(pattern) {
    if (!pattern) return '$adu.matchWildcard()';

    if (pattern.type === ASTNodeType.WILDCARD_PATTERN) {
      return '$adu.matchWildcard()';
    }
    if (pattern.type === ASTNodeType.LITERAL) {
      return `$adu.matchLiteral(${pattern.raw || JSON.stringify(pattern.value)})`;
    }
    if (pattern.type === ASTNodeType.RANGE_EXPRESSION) {
      const start = this.generateExpression(pattern.start);
      const end = this.generateExpression(pattern.end);
      return `$adu.matchRange(${start}, ${end})`;
    }
    if (pattern.type === ASTNodeType.OBJECT_LITERAL) {
      const schemaEntries = pattern.properties.map(p => {
        const key = p.key.name || p.key.value;
        const valMatcher = this.generatePatternMatcher(p.value);
        return `"${key}": ${valMatcher}`;
      });
      return `$adu.matchObject({ ${schemaEntries.join(', ')} })`;
    }
    if (pattern.type === ASTNodeType.ARRAY_LITERAL) {
      let hasRest = false;
      const elemMatchers = [];
      for (const el of pattern.elements) {
        if (el.type === ASTNodeType.SPREAD_ELEMENT) {
          hasRest = true;
          break;
        }
        elemMatchers.push(this.generatePatternMatcher(el));
      }
      return `$adu.matchArray([${elemMatchers.join(', ')}], ${hasRest})`;
    }
    if (pattern.type === ASTNodeType.IDENTIFIER) {
      // Bind pattern: matches anything, passes to body
      return '$adu.matchWildcard()';
    }

    return '$adu.matchWildcard()';
  }

  generateCallExpression(node) {
    const callee = this.generateExpression(node.callee);
    const args = node.arguments.map(a => this.generateExpression(a)).join(', ');
    return `${callee}${node.optional ? '?.' : ''}(${args})`;
  }

  generateClosureExpression(node) {
    const asyncPrefix = node.isAsync ? 'async ' : '';
    const params = node.params.map(p => this.generatePattern(p)).join(', ');

    if (node.isExpressionBody && node.body.type !== ASTNodeType.BLOCK_STATEMENT) {
      return `(${asyncPrefix}(${params}) => ${this.generateExpression(node.body)})`;
    } else {
      const cg = new CodeGenerator(this.options);
      cg.indentation = 1;
      const stmts = node.body.type === ASTNodeType.BLOCK_STATEMENT ? node.body.body : [node.body];
      for (const stmt of stmts) {
        cg.generateStatement(stmt);
      }
      return `(${asyncPrefix}(${params}) => {\n${cg.output.join('')}})`;
    }
  }

  generateObjectLiteral(node) {
    const props = node.properties.map(p => {
      if (p.type === ASTNodeType.SPREAD_ELEMENT) {
        return `...${this.generateExpression(p.argument)}`;
      }
      const keyStr = p.computed ? `[${this.generateExpression(p.key)}]` : (p.key.name || JSON.stringify(p.key.value));
      if (p.shorthand) return keyStr;
      return `${keyStr}: ${this.generateExpression(p.value)}`;
    });
    return `{ ${props.join(', ')} }`;
  }

  generateSourceMap(code) {
    return {
      version: 3,
      file: this.options.sourceFileName.replace(/\.ads$/, '.js'),
      sources: [this.options.sourceFileName],
      mappings: '', // Basic v3 source map container
      sourcesContent: []
    };
  }

  getInlinedRuntimeCode() {
    return `const $adu = (() => {
  let activeEffect = null;
  class Signal {
    constructor(init) { this._subs = new Set(); this._val = this._wrap(init); }
    _wrap(v) {
      if (v !== null && typeof v === 'object' && !v.__isProxy) {
        const s = this;
        return new Proxy(v, {
          get(t, p, r) { if (p === '__isProxy') return true; s._track(); const res = Reflect.get(t, p, r); return (typeof res === 'object' && res !== null) ? s._wrap(res) : res; },
          set(t, p, nv, r) { const old = Reflect.get(t, p, r); const ok = Reflect.set(t, p, nv, r); if (old !== nv) s._notify(); return ok; }
        });
      }
      return v;
    }
    _track() { if (activeEffect) this._subs.add(activeEffect); }
    _notify() { Array.from(this._subs).forEach(fn => { try { fn(); } catch (e) { console.error('[AduScript Reactive Error]', e); } }); }
    get value() { this._track(); return this._val; }
    set value(nv) { if (this._val !== nv) { this._val = this._wrap(nv); this._notify(); } }
    toString() { return String(this.value); }
    valueOf() { return this.value; }
  }
  return {
    state: (v) => new Signal(v),
    watch: (s, cb) => { if (s instanceof Signal) { let old = s.value; const w = () => { const cur = s.value; if (cur !== old) { const p = old; old = cur; cb(cur, p); } }; s._subs.add(w); return () => s._subs.delete(w); } },
    effect: (fn) => { const r = () => { const prev = activeEffect; activeEffect = r; try { fn(); } finally { activeEffect = prev; } }; r(); return r; },
    match: (val, arms) => { for (const a of arms) { if (a.test(val)) { if (!a.guard || a.guard(val)) return a.body(val); } } throw new Error('[AduScript Pattern Match Error] No match for ' + JSON.stringify(val)); },
    matchLiteral: (exp) => (v) => v === exp,
    matchRange: (s, e) => (v) => typeof v === 'number' && v >= s && v <= e,
    matchWildcard: () => () => true,
    matchObject: (sch) => (v) => { if (v === null || typeof v !== 'object') return false; for (const [k, exp] of Object.entries(sch)) { if (!(k in v)) return false; if (typeof exp === 'function' ? !exp(v[k]) : v[k] !== exp) return false; } return true; },
    matchArray: (elems, hasRest) => (v) => { if (!Array.isArray(v)) return false; if (!hasRest && v.length !== elems.length) return false; if (hasRest && v.length < elems.length) return false; for (let i = 0; i < elems.length; i++) { if (typeof elems[i] === 'function' ? !elems[i](v[i]) : v[i] !== elems[i]) return false; } return true; },
    pipe: (init, ...fns) => fns.reduce((acc, f) => typeof f === 'function' ? f(acc) : f, init),
    range: (s, e) => { const res = []; if (s <= e) { for (let i = s; i <= e; i++) res.push(i); } else { for (let i = s; i >= e; i--) res.push(i); } return res; }
  };
})();`;
  }
}
