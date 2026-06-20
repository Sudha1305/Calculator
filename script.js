(() => {
  'use strict';

  const displayEl = document.getElementById('display');
  if (!displayEl) return;

  const state = {
    expression: '',
    current: '0',
    lastWasOperator: false,
    justEvaluated: false,
  };

  const OPERATORS = new Set(['+', '-', '*', '/']);
  const PERCENT_ACTION = 'percent';

  function setDisplay() {
    // If the user just pressed an operator, state.expression already ends with it.
    if (state.lastWasOperator && state.expression) {
      displayEl.value = state.expression;
      return;
    }

    displayEl.value = state.current;
  }

  // Real-time results preview
  function previewResult() {
    if (state.justEvaluated) return;

    // Only preview when expression is structurally complete enough.
    if (!state.expression) {
      // If user is only typing a number, keep current value.
      setDisplay();
      return;
    }

    // If expression ends with an operator, we can still preview using the current number.
    // (state.lastWasOperator means user just pressed operator; safeEvaluate will still work)
    if (state.current === '' || state.current === '.' || state.current === 'Error') return;

    // Avoid preview while the user just pressed an operator.
    // The calculator display should show the typed expression (e.g., "5+").
    if (state.lastWasOperator) return;

    // Only allow preview when expression/current form a complete number.
    // Also don't preview right after '=' (Enter key) action.
    if (state.justEvaluated) return;

    // Don't preview after operator entry; preview starts after digits/dot/backspace/percent.


    const expr = (state.expression || '') + state.current;


    try {
      const value = safeEvaluate(expr);
      displayEl.value = formatResult(value);


    } catch {
      // If preview fails (incomplete expression), revert to normal display.
      setDisplay();
    }
  }



  function normalizeNumberString(s) {
    if (s === '' || s === '.') return '0';
    if (s.startsWith('0') && s.length > 1 && s[1] !== '.') {
      return s.replace(/^0+/, '') || '0';
    }
    return s;
  }

  function appendDigit(d) {
    state.justEvaluated = false;

    // d can be '0'-'9' or '00'
    if (state.justEvaluated) {
      state.expression = '';
      state.current = '0';
      state.justEvaluated = false;
      state.lastWasOperator = false;
    }

    if (state.current === '0') {
      state.current = d;
    } else {
      state.current += d;
    }

    state.current = normalizeNumberString(state.current);
    state.lastWasOperator = false;
    setDisplay();
    previewResult();
  }


  function appendDot() {
    if (state.justEvaluated) {
      state.expression = '';
      state.current = '0';
      state.justEvaluated = false;
      state.lastWasOperator = false;
    }

    if (!state.current.includes('.')) {
      state.current += '.';
      state.lastWasOperator = false;
      setDisplay();
    }
  }

  function appendOperator(op) {

    if (state.justEvaluated) state.justEvaluated = false;

    const cur = state.current;

    if (state.lastWasOperator) {
      // Replace operator if user presses two operators in a row.
      state.expression = state.expression.replace(/[+\-*/]$/, op);
    } else {
      state.expression = state.expression + cur;
      state.expression += op;
    }

    state.current = '0';
    state.lastWasOperator = true;

    // Show the operator immediately (user expects it to be visible).
    // Example: typing 5 then pressing '+' should show "5+".
    displayEl.value = state.expression;
    previewResult();
  }



  function backspace() {
    if (state.justEvaluated) state.justEvaluated = false;

    if (!state.lastWasOperator) {
      if (state.current.length <= 1) {
        state.current = '0';
      } else {
        state.current = state.current.slice(0, -1);
        if (state.current === '-' || state.current === '') state.current = '0';
      }
      state.current = normalizeNumberString(state.current);
      setDisplay();
      previewResult();
      return;

    }

    if (state.expression) {
      state.expression = state.expression.slice(0, -1);
      state.current = '0';
      state.lastWasOperator = /[+\-*/]$/.test(state.expression);
      setDisplay();
      previewResult();
    }

  }

  function clearAll() {
    state.expression = '';
    state.current = '0';
    state.lastWasOperator = false;
    state.justEvaluated = false;
    setDisplay();
    previewResult();
  }


  function applyPercent() {
    const n = Number(state.current);
    if (!Number.isFinite(n)) {
      state.expression = '';
      state.current = 'Error';
      state.lastWasOperator = false;
      state.justEvaluated = true;
      setDisplay();
      return;
    }

    // Original HTML behavior: display = display/100
    state.current = formatResult(n / 100);
    state.lastWasOperator = false;
    state.justEvaluated = false;
    setDisplay();
    previewResult();
  }

  function safeEvaluate(expr) {

    // Tiny evaluator for numbers and + - * /
    // Tokenization
    const tokens = [];
    let i = 0;

    const isOpChar = (ch) => OPERATORS.has(ch);

    while (i < expr.length) {
      const ch = expr[i];
      if (ch === ' ') {
        i++;
        continue;
      }

      if (isOpChar(ch)) {
        tokens.push({ type: 'op', value: ch });
        i++;
        continue;
      }

      if ((ch >= '0' && ch <= '9') || ch === '.') {
        const start = i;
        i++;
        while (i < expr.length) {
          const c = expr[i];
          if ((c >= '0' && c <= '9') || c === '.') i++;
          else break;
        }
        const numStr = expr.slice(start, i);
        if (numStr === '.' || numStr === '') throw new Error('Invalid number');
        tokens.push({ type: 'num', value: Number(numStr) });
        continue;
      }

      throw new Error('Invalid character');
    }

    if (tokens.length === 0) return 0;

    // Shunting-yard
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
    const output = [];
    const ops = [];

    for (const t of tokens) {
      if (t.type === 'num') {
        output.push(t);
      } else {
        while (ops.length) {
          const top = ops[ops.length - 1];
          if (precedence[top.value] >= precedence[t.value]) output.push(ops.pop());
          else break;
        }
        ops.push(t);
      }
    }
    while (ops.length) output.push(ops.pop());

    // Evaluate RPN
    const stack = [];
    for (const t of output) {
      if (t.type === 'num') {
        stack.push(t.value);
      } else {
        const b = stack.pop();
        const a = stack.pop();
        if (a === undefined || b === undefined) throw new Error('Malformed expression');
        switch (t.value) {
          case '+': stack.push(a + b); break;
          case '-': stack.push(a - b); break;
          case '*': stack.push(a * b); break;
          case '/': stack.push(a / b); break;
          default: throw new Error('Unknown operator');
        }
      }
    }

    const res = stack[0];
    if (!Number.isFinite(res)) throw new Error('Non-finite result');
    return res;
  }

  function formatResult(n) {
    const abs = Math.abs(n);
    if (abs !== 0 && (abs >= 1e12 || abs < 1e-9)) {
      return n.toExponential(8).replace(/\.0+e/, 'e');
    }

    const s = n.toPrecision(12);
    const num = Number(s); // remove trailing zeros
    return String(num);
  }

  function equals() {
    if (state.lastWasOperator) {
      state.expression = state.expression.slice(0, -1);
    }

    const fullExpr = (state.expression || '') + state.current;
    if (!fullExpr.trim()) return;

    try {
      const value = safeEvaluate(fullExpr);
      state.expression = state.expression ? state.expression + state.current : state.current;
      state.current = formatResult(value);
      state.lastWasOperator = false;
      state.justEvaluated = true;
      // Avoid preview changing the final value after '='.
      setDisplay();

    } catch {
      state.expression = '';
      state.current = 'Error';
      state.lastWasOperator = false;
      state.justEvaluated = true;
      setDisplay();
    }
  }

  function handleKey(action, value) {
    if (state.current === 'Error' && action !== 'clear') clearAll();

    if (action === 'clear') return clearAll();
    if (action === 'backspace') return backspace();
    if (action === 'equals') return equals();
    if (action === 'dot') return appendDot();
    if (action === PERCENT_ACTION) return applyPercent();

    if (value !== undefined) {
      if (/^(?:[0-9]{1,2})$/.test(value)) return appendDigit(value);
      if (OPERATORS.has(value)) return appendOperator(value);
    }
  }

  // Click handling for all buttons that use data-action/data-value
  const root = document.querySelector('.numpad') || document;
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('input[data-action], input[data-value]');
    if (!btn) return;

    const action = btn.dataset.action;
    const value = btn.dataset.value;

    if (action) handleKey(action, value);
    else if (value !== undefined) handleKey(undefined, value);
  });

  // Keyboard support
  window.addEventListener('keydown', (e) => {
    const key = e.key;

    if (key >= '0' && key <= '9') {
      e.preventDefault();
      handleKey(undefined, key);
      return;
    }

    if (key === '.') {
      e.preventDefault();
      handleKey('dot');
      return;
    }

    if (key === '+' || key === '-' || key === '*' || key === '/') {
      e.preventDefault();
      handleKey(undefined, key);
      return;
    }

    if (key === 'Enter' || key === '=') {
      e.preventDefault();
      handleKey('equals');
      return;
    }

    if (key === 'Escape') {
      e.preventDefault();
      handleKey('clear');
      return;
    }

    if (key === 'Backspace') {
      e.preventDefault();
      handleKey('backspace');
      return;
    }

    if (key === '%') {
      e.preventDefault();
      handleKey(PERCENT_ACTION);
      return;
    }
  });

  setDisplay();
})();

