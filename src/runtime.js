/**
 * AduScript Runtime Library ($adu)
 * Zero-dependency reactive primitives, pattern matching engine, CDN resolution, and utilities.
 */

// Active effect tracker for automatic dependency collection
let activeEffect = null;

class Signal {
  constructor(initialValue) {
    this._subscribers = new Set();
    this._value = this._wrap(initialValue);
  }

  _wrap(val) {
    if (val !== null && typeof val === 'object' && !val.__isProxy) {
      const self = this;
      return new Proxy(val, {
        get(target, prop, receiver) {
          if (prop === '__isProxy') return true;
          self._track();
          const res = Reflect.get(target, prop, receiver);
          return (typeof res === 'object' && res !== null) ? self._wrap(res) : res;
        },
        set(target, prop, newVal, receiver) {
          const old = Reflect.get(target, prop, receiver);
          const success = Reflect.set(target, prop, newVal, receiver);
          if (old !== newVal) {
            self._notify();
          }
          return success;
        }
      });
    }
    return val;
  }

  _track() {
    if (activeEffect) {
      this._subscribers.add(activeEffect);
    }
  }

  _notify() {
    // Clone subscribers to avoid infinite loops if an effect modifies the signal
    const subs = Array.from(this._subscribers);
    for (const sub of subs) {
      try {
        sub();
      } catch (err) {
        console.error('[AduScript Reactive Error]', err);
      }
    }
  }

  get value() {
    this._track();
    return this._value;
  }

  set value(newVal) {
    if (this._value !== newVal) {
      this._value = this._wrap(newVal);
      this._notify();
    }
  }

  // Value coercion
  toString() {
    return String(this.value);
  }

  valueOf() {
    return this.value;
  }
}

/**
 * Creates a reactive state signal.
 * Usage in AduScript: `state count = 0` -> `$adu.state(0)`
 */
export function state(initialValue) {
  return new Signal(initialValue);
}

/**
 * Observes a specific state signal and runs a callback on change.
 * Usage in AduScript: `watch count => { ... }` -> `$adu.watch(count, (val) => { ... })`
 */
export function watch(target, callback) {
  if (target instanceof Signal) {
    let lastVal = target.value;
    const watcher = () => {
      const current = target.value;
      if (current !== lastVal) {
        const prev = lastVal;
        lastVal = current;
        callback(current, prev);
      }
    };
    target._subscribers.add(watcher);
    return () => target._subscribers.delete(watcher);
  } else if (typeof target === 'function') {
    // Computed watch
    return effect(() => {
      callback(target());
    });
  }
}

/**
 * Runs an effect function and automatically tracks all accessed signals.
 * Usage in AduScript: `effect { ... }` -> `$adu.effect(() => { ... })`
 */
export function effect(fn) {
  const runner = () => {
    const prevEffect = activeEffect;
    activeEffect = runner;
    try {
      fn();
    } finally {
      activeEffect = prevEffect;
    }
  };
  runner();
  return runner;
}

/**
 * Creates a reactive computed signal derived from other signals.
 */
export function computed(fn) {
  const comp = state(undefined);
  effect(() => {
    comp.value = fn();
  });
  return comp;
}

/**
 * Helper to bind reactive state to a DOM element property.
 */
export function bind(el, prop, signal) {
  if (typeof el === 'string' && typeof document !== 'undefined') el = document.querySelector(el);
  if (!el || !(signal instanceof Signal)) return;

  effect(() => {
    el[prop] = signal.value;
  });

  if (prop === 'value' || prop === 'checked') {
    el.addEventListener('input', (e) => {
      signal.value = prop === 'checked' ? e.target.checked : e.target.value;
    });
  }
}

/**
 * Reactive HTML Template Tag Helper
 * Usage: html`<div class="card">${title.value}</div>`
 */
export function html(strings, ...values) {
  if (typeof document === 'undefined') {
    return strings.reduce((acc, str, i) => acc + str + (values[i] !== undefined ? values[i] : ''), '');
  }

  let markup = '';
  const listeners = [];
  const slots = [];

  strings.forEach((str, i) => {
    markup += str;
    if (i < values.length) {
      const val = values[i];
      if (typeof val === 'function') {
        const handlerId = `__adu_evt_${Math.random().toString(36).slice(2, 9)}`;
        listeners.push({ id: handlerId, fn: val });
        markup += `"${handlerId}"`;
      } else if (val && (val instanceof Node || (Array.isArray(val) && val.some(x => x instanceof Node)))) {
        const slotId = `__adu_slot_${Math.random().toString(36).slice(2, 9)}`;
        slots.push({ id: slotId, node: val });
        markup += `<span data-adu-slot="${slotId}"></span>`;
      } else if (val && typeof val === 'object' && val.value !== undefined) {
        // Signal / State
        const sVal = val.value;
        if (sVal && (sVal instanceof Node || (Array.isArray(sVal) && sVal.some(x => x instanceof Node)))) {
          const slotId = `__adu_slot_${Math.random().toString(36).slice(2, 9)}`;
          slots.push({ id: slotId, node: sVal });
          markup += `<span data-adu-slot="${slotId}"></span>`;
        } else {
          markup += sVal !== undefined && sVal !== null ? sVal : '';
        }
      } else if (Array.isArray(val)) {
        markup += val.map(item => (item && item.value !== undefined ? item.value : (item !== undefined && item !== null ? item : ''))).join('');
      } else if (val !== undefined && val !== null) {
        markup += val;
      }
    }
  });

  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  const fragment = template.content;

  // 1. Replace slot placeholders with actual DOM Nodes
  for (const { id, node } of slots) {
    const slotEl = fragment.querySelector(`[data-adu-slot="${id}"]`);
    if (slotEl) {
      if (Array.isArray(node)) {
        const nodesToInsert = [];
        for (const item of node) {
          if (item instanceof Node) {
            nodesToInsert.push(item);
          } else if (item !== undefined && item !== null) {
            nodesToInsert.push(document.createTextNode(String(item)));
          }
        }
        slotEl.replaceWith(...nodesToInsert);
      } else if (node instanceof Node) {
        slotEl.replaceWith(node);
      }
    }
  }

  // 2. Attach event handlers across standard event attributes
  for (const { id, fn } of listeners) {
    const allMatching = fragment.querySelectorAll('*');
    for (const el of allMatching) {
      for (const attr of el.getAttributeNames()) {
        if (el.getAttribute(attr) === id) {
          el.removeAttribute(attr);
          const eventName = attr.startsWith('on') ? attr.slice(2).toLowerCase() : attr.toLowerCase();
          el.addEventListener(eventName, fn);
        }
      }
    }
  }

  return fragment.childElementCount === 1 ? fragment.firstElementChild : fragment;
}

/**
 * CSS Style Injection Helper
 * Usage: css`
 *   .card { background: #1a1d2d; padding: 20px; border-radius: 10px; }
 * `
 */
export function css(strings, ...values) {
  const styleContent = strings.reduce((acc, str, i) => acc + str + (values[i] !== undefined ? values[i] : ''), '');
  if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-adu-style', 'true');
    styleEl.textContent = styleContent;
    document.head.appendChild(styleEl);
  }
  return styleContent;
}

/**
 * Component Mount Helper
 * Mounts a reactive render function to a root DOM container.
 */
export function mount(container, renderFn) {
  const el = typeof container === 'string'
    ? (typeof document !== 'undefined' ? document.querySelector(container) : null)
    : container;

  if (!el) {
    console.warn(`[AduScript Mount] Container '${container}' not found.`);
    return;
  }

  const effectFn = () => {
    const rendered = renderFn();
    if (typeof rendered === 'string') {
      el.innerHTML = rendered;
    } else if (rendered instanceof Node) {
      el.innerHTML = '';
      el.appendChild(rendered);
    }
  };

  effect(effectFn);
}

/**
 * Pattern matching runtime evaluator.
 * Usage in AduScript: `match val with ...` -> `$adu.match(val, [ ... ])`
 */
export function match(value, arms) {
  for (const arm of arms) {
    if (typeof arm === 'function') {
      const res = arm(value);
      if (res && res.matched) return res.value;
    } else if (arm && typeof arm.test === 'function') {
      if (arm.test(value)) {
        if (!arm.guard || arm.guard(value)) {
          return typeof arm.body === 'function' ? arm.body(value) : arm.body;
        }
      }
    }
  }
  throw new Error(`[AduScript Pattern Match Error] No matching arm for value: ${JSON.stringify(value)}`);
}

/**
 * Pattern test helpers
 */
export function matchLiteral(expected) {
  return (val) => val === expected;
}

export function matchRange(start, end) {
  return (val) => typeof val === 'number' && val >= start && val <= end;
}

export function matchWildcard() {
  return () => true;
}

export function matchObject(schema) {
  return (val) => {
    if (val === null || typeof val !== 'object') return false;
    for (const [k, expected] of Object.entries(schema)) {
      if (!(k in val)) return false;
      if (typeof expected === 'function') {
        if (!expected(val[k])) return false;
      } else if (val[k] !== expected) {
        return false;
      }
    }
    return true;
  };
}

export function matchArray(elements, hasRest = false) {
  return (val) => {
    if (!Array.isArray(val)) return false;
    if (!hasRest && val.length !== elements.length) return false;
    if (hasRest && val.length < elements.length) return false;
    for (let i = 0; i < elements.length; i++) {
      const expected = elements[i];
      if (typeof expected === 'function') {
        if (!expected(val[i])) return false;
      } else if (val[i] !== expected) {
        return false;
      }
    }
    return true;
  };
}

/**
 * Pipeline helper
 */
export function pipe(initialValue, ...fns) {
  return fns.reduce((acc, fn) => {
    if (typeof fn === 'function') {
      return fn(acc);
    }
    return fn;
  }, initialValue);
}

/**
 * Range generator / array helper: 0..10
 */
export function range(start, end, inclusive = true) {
  const result = [];
  if (start <= end) {
    for (let i = start; inclusive ? i <= end : i < end; i++) {
      result.push(i);
    }
  } else {
    for (let i = start; inclusive ? i >= end : i > end; i--) {
      result.push(i);
    }
  }
  return result;
}

/**
 * Smart CDN Package Resolver
 * Resolves standard CDN names to ESM URLs.
 */
export const CDN_MAP = {
  'three': 'https://esm.sh/three',
  'three/addons': 'https://esm.sh/three/addons/',
  'gsap': 'https://esm.sh/gsap',
  'pixi': 'https://esm.sh/pixi.js',
  'pixi.js': 'https://esm.sh/pixi.js',
  'canvas-confetti': 'https://esm.sh/canvas-confetti',
  'lucide': 'https://esm.sh/lucide',
  'chart.js': 'https://esm.sh/chart.js/auto',
  'howler': 'https://esm.sh/howler',
  'matter-js': 'https://esm.sh/matter-js',
  'lodash-es': 'https://esm.sh/lodash-es',
  'animejs': 'https://esm.sh/animejs'
};

export function resolveCDN(specifier) {
  if (specifier.startsWith('http://') || specifier.startsWith('https://')) {
    return specifier;
  }
  const clean = specifier.startsWith('cdn:') ? specifier.slice(4) : specifier;
  if (CDN_MAP[clean]) {
    return CDN_MAP[clean];
  }
  return `https://esm.sh/${clean}`;
}

/**
 * Official AduScript Logo SVG & Helper
 */
export const LOGO_SVG = `<svg viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="800" rx="40" fill="#C0004D"/><path d="M352.688 735H310.5L358.031 591H411.469L459 735H416.813L385.313 630.656H384.188L352.688 735ZM344.813 678.188H424.125V707.437H344.813V678.188ZM528.275 735H472.869V591H527.713C542.525 591 555.322 593.883 566.104 599.648C576.932 605.367 585.275 613.617 591.135 624.398C597.041 635.133 599.994 648 599.994 663C599.994 678 597.064 690.891 591.205 701.672C585.346 712.406 577.049 720.656 566.314 726.422C555.58 732.141 542.9 735 528.275 735ZM511.963 701.812H526.869C533.994 701.812 540.064 700.664 545.08 698.367C550.143 696.07 553.986 692.109 556.611 686.484C559.283 680.859 560.619 673.031 560.619 663C560.619 652.969 559.26 645.141 556.541 639.516C553.869 633.891 549.932 629.93 544.729 627.633C539.572 625.336 533.244 624.187 525.744 624.187H511.963V701.812ZM695.707 636C695.332 631.312 693.574 627.656 690.434 625.031C687.34 622.406 682.629 621.094 676.301 621.094C672.27 621.094 668.965 621.586 666.387 622.57C663.855 623.508 661.98 624.797 660.762 626.437C659.543 628.078 658.91 629.953 658.863 632.062C658.77 633.797 659.074 635.367 659.777 636.773C660.527 638.133 661.699 639.375 663.293 640.5C664.887 641.578 666.926 642.562 669.41 643.453C671.895 644.344 674.848 645.141 678.27 645.844L690.082 648.375C698.051 650.062 704.871 652.289 710.543 655.055C716.215 657.82 720.855 661.078 724.465 664.828C728.074 668.531 730.723 672.703 732.41 677.344C734.145 681.984 735.035 687.047 735.082 692.531C735.035 702 732.668 710.016 727.98 716.578C723.293 723.141 716.59 728.133 707.871 731.555C699.199 734.977 688.77 736.688 676.582 736.688C664.066 736.688 653.145 734.836 643.816 731.133C634.535 727.43 627.316 721.734 622.16 714.047C617.051 706.312 614.473 696.422 614.426 684.375H651.551C651.785 688.781 652.887 692.484 654.855 695.484C656.824 698.484 659.59 700.758 663.152 702.305C666.762 703.852 671.051 704.625 676.02 704.625C680.191 704.625 683.684 704.109 686.496 703.078C689.309 702.047 691.441 700.617 692.895 698.789C694.348 696.961 695.098 694.875 695.145 692.531C695.098 690.328 694.371 688.406 692.965 686.766C691.605 685.078 689.355 683.578 686.215 682.266C683.074 680.906 678.832 679.641 673.488 678.469L659.145 675.375C646.395 672.609 636.34 667.992 628.98 661.523C621.668 655.008 618.035 646.125 618.082 634.875C618.035 625.734 620.473 617.742 625.395 610.898C630.363 604.008 637.23 598.641 645.996 594.797C654.809 590.953 664.91 589.031 676.301 589.031C687.926 589.031 697.98 590.977 706.465 594.867C714.949 598.758 721.488 604.242 726.082 611.32C730.723 618.352 733.066 626.578 733.113 636H695.707Z" fill="white"/><path d="M418 0L0 447V532.254L498.5 0H418Z" fill="#C7004F"/></svg>`;

export function logo(size = 32, className = 'adu-logo') {
  return `<span class="${className}" style="display:inline-flex;width:${size}px;height:${size}px;align-items:center;justify-content:center;vertical-align:middle;flex-shrink:0;">${LOGO_SVG.replace('<svg ', `<svg width="${size}" height="${size}" `)}</span>`;
}

// Export namespace object for bundle injection
export const $adu = {
  state,
  watch,
  effect,
  computed,
  bind,
  html,
  css,
  mount,
  match,
  matchLiteral,
  matchRange,
  matchWildcard,
  matchObject,
  matchArray,
  pipe,
  range,
  resolveCDN,
  CDN_MAP,
  LOGO_SVG,
  logo
};

export default $adu;
