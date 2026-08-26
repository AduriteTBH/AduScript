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
    return `const $adu = (typeof globalThis !== 'undefined' && globalThis.$adu) ? globalThis.$adu : (() => {
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
  const LOGO_SVG = \`<svg viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="800" rx="40" fill="#C0004D"/><path d="M352.688 735H310.5L358.031 591H411.469L459 735H416.813L385.313 630.656H384.188L352.688 735ZM344.813 678.188H424.125V707.437H344.813V678.188ZM528.275 735H472.869V591H527.713C542.525 591 555.322 593.883 566.104 599.648C576.932 605.367 585.275 613.617 591.135 624.398C597.041 635.133 599.994 648 599.994 663C599.994 678 597.064 690.891 591.205 701.672C585.346 712.406 577.049 720.656 566.314 726.422C555.58 732.141 542.9 735 528.275 735ZM511.963 701.812H526.869C533.994 701.812 540.064 700.664 545.08 698.367C550.143 696.07 553.986 692.109 556.611 686.484C559.283 680.859 560.619 673.031 560.619 663C560.619 652.969 559.26 645.141 556.541 639.516C553.869 633.891 549.932 629.93 544.729 627.633C539.572 625.336 533.244 624.187 525.744 624.187H511.963V701.812ZM695.707 636C695.332 631.312 693.574 627.656 690.434 625.031C687.34 622.406 682.629 621.094 676.301 621.094C672.27 621.094 668.965 621.586 666.387 622.57C663.855 623.508 661.98 624.797 660.762 626.437C659.543 628.078 658.91 629.953 658.863 632.062C658.77 633.797 659.074 635.367 659.777 636.773C660.527 638.133 661.699 639.375 663.293 640.5C664.887 641.578 666.926 642.562 669.41 643.453C671.895 644.344 674.848 645.141 678.27 645.844L690.082 648.375C698.051 650.062 704.871 652.289 710.543 655.055C716.215 657.82 720.855 661.078 724.465 664.828C728.074 668.531 730.723 672.703 732.41 677.344C734.145 681.984 735.035 687.047 735.082 692.531C735.035 702 732.668 710.016 727.98 716.578C723.293 723.141 716.59 728.133 707.871 731.555C699.199 734.977 688.77 736.688 676.582 736.688C664.066 736.688 653.145 734.836 643.816 731.133C634.535 727.43 627.316 721.734 622.16 714.047C617.051 706.312 614.473 696.422 614.426 684.375H651.551C651.785 688.781 652.887 692.484 654.855 695.484C656.824 698.484 659.59 700.758 663.152 702.305C666.762 703.852 671.051 704.625 676.02 704.625C680.191 704.625 683.684 704.109 686.496 703.078C689.309 702.047 691.441 700.617 692.895 698.789C694.348 696.961 695.098 694.875 695.145 692.531C695.098 690.328 694.371 688.406 692.965 686.766C691.605 685.078 689.355 683.578 686.215 682.266C683.074 680.906 678.832 679.641 673.488 678.469L659.145 675.375C646.395 672.609 636.34 667.992 628.98 661.523C621.668 655.008 618.035 646.125 618.082 634.875C618.035 625.734 620.473 617.742 625.395 610.898C630.363 604.008 637.23 598.641 645.996 594.797C654.809 590.953 664.91 589.031 676.301 589.031C687.926 589.031 697.98 590.977 706.465 594.867C714.949 598.758 721.488 604.242 726.082 611.32C730.723 618.352 733.066 626.578 733.113 636H695.707Z" fill="white"/><path d="M418 0L0 447V532.254L498.5 0H418Z" fill="#C7004F"/></svg>\`;
  function effect(fn) {
    const r = () => { const prev = activeEffect; activeEffect = r; try { fn(); } finally { activeEffect = prev; } };
    r();
    return r;
  }
  function mount(container, renderFn) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;
    const effectFn = () => {
      const rendered = renderFn();
      if (typeof rendered === 'string') el.innerHTML = rendered;
      else if (rendered instanceof Node) { el.innerHTML = ''; el.appendChild(rendered); }
    };
    effect(effectFn);
  }
  function html(strings, ...values) {
    let raw = '';
    const events = [];
    strings.forEach((str, i) => {
      raw += str;
      if (i < values.length) {
        const val = values[i];
        if (typeof val === 'function') {
          const id = '__adu_evt_' + Math.random().toString(36).slice(2, 9);
          events.push({ id, fn: val });
          raw += 'data-adu-evt="' + id + '"';
        } else if (val && typeof val === 'object' && val.value !== undefined) {
          raw += String(val.value);
        } else if (Array.isArray(val)) {
          raw += val.map(item => (item && item.value !== undefined ? String(item.value) : String(item || ''))).join('');
        } else {
          raw += (val === undefined || val === null) ? '' : String(val);
        }
      }
    });
    if (typeof document === 'undefined') return raw;
    const template = document.createElement('template');
    template.innerHTML = raw.trim();
    const fragment = template.content;
    events.forEach(({ id, fn }) => {
      const target = fragment.querySelector('[data-adu-evt="' + id + '"]');
      if (target) {
        target.removeAttribute('data-adu-evt');
        const attrMatches = [...raw.matchAll(/on([a-z]+)=["']?data-adu-evt/gi)];
        attrMatches.forEach(m => {
          target.addEventListener(m[1].toLowerCase(), fn);
          target.removeAttribute('on' + m[1].toLowerCase());
        });
      }
    });
    return fragment.childElementCount === 1 ? fragment.firstElementChild : fragment;
  }
  function css(strings, ...values) {
    if (typeof document === 'undefined') return;
    let cssText = '';
    strings.forEach((str, i) => { cssText += str + (values[i] || ''); });
    const style = document.createElement('style');
    style.textContent = cssText;
    document.head.appendChild(style);
  }
  function logo(size = 32, className = 'adu-logo') {
    return LOGO_SVG.replace('<svg ', '<svg class="' + className + '" width="' + size + '" height="' + size + '" ');
  }
  return {
    state: (v) => new Signal(v),
    watch: (s, cb) => { if (s instanceof Signal) { let old = s.value; const w = () => { const cur = s.value; if (cur !== old) { const p = old; old = cur; cb(cur, p); } }; s._subs.add(w); return () => s._subs.delete(w); } },
    effect, mount, html, css, logo, LOGO_SVG,
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
