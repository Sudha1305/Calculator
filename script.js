(() => {
  'use strict';

  // Elements
  const display = document.getElementById('display');
  const historyList = document.getElementById('historyList');
  const themeToggle = document.getElementById('themeToggle');
  const copyBtn = document.getElementById('copyBtn');
  const clearHistoryBtn = document.getElementById('clearHistory');

  // State
  let currentInput = '';
  let lastExpression = '';
  let history = JSON.parse(localStorage.getItem('calcHistory')) || [];
  let isDarkMode = localStorage.getItem('darkMode') !== 'false';

  // Initialize
  function init() {
    applyTheme();
    renderHistory();
    display.value = '0';
  }

  // Theme functions
  function applyTheme() {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
    localStorage.setItem('darkMode', isDarkMode);
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    applyTheme();
  }

  // History functions
  function addToHistory(expression, result) {
    history.push({ expression, result, timestamp: Date.now() });
    if (history.length > 50) history.shift(); // Keep last 50
    localStorage.setItem('calcHistory', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = '';
    history.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <div class="history-expression">${item.expression}</div>
        <div class="history-result">= ${item.result}</div>
      `;
      div.addEventListener('click', () => {
        currentInput = item.result;
        display.value = currentInput;
      });
      historyList.appendChild(div);
    });
  }

  function clearHistory() {
    history = [];
    localStorage.setItem('calcHistory', JSON.stringify(history));
    renderHistory();
  }

  // Copy function
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(display.value);
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  // Safe evaluator (no eval!)
  function safeEvaluate(expr) {
    // Tokenizer
    const tokens = [];
    let current = '';
    const operators = ['+', '-', '*', '/', '%'];
    
    for (let char of expr) {
      if (operators.includes(char)) {
        if (current) tokens.push(parseFloat(current));
        tokens.push(char);
        current = '';
      } else {
        current += char;
      }
    }
    if (current) tokens.push(parseFloat(current));

    // Handle percent
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === '%') {
        if (i > 0 && typeof tokens[i-1] === 'number') {
          tokens[i-1] = tokens[i-1] / 100;
          tokens.splice(i, 1);
          i--;
        }
      }
    }

    // Evaluate multiplication and division first
    let i = 0;
    while (i < tokens.length) {
      if (tokens[i] === '*' || tokens[i] === '/') {
        const left = tokens[i-1];
        const right = tokens[i+1];
        let result;
        if (tokens[i] === '*') result = left * right;
        else if (right === 0) throw new Error('Division by zero');
        else result = left / right;
        
        tokens.splice(i-1, 3, result);
        i--;
      } else {
        i++;
      }
    }

    // Then addition and subtraction
    i = 0;
    while (i < tokens.length) {
      if (tokens[i] === '+' || tokens[i] === '-') {
        const left = tokens[i-1];
        const right = tokens[i+1];
        let result;
        if (tokens[i] === '+') result = left + right;
        else result = left - right;
        
        tokens.splice(i-1, 3, result);
        i--;
      } else {
        i++;
      }
    }

    if (tokens.length !== 1 || isNaN(tokens[0])) throw new Error('Invalid expression');
    return tokens[0];
  }

  // Click handler
  document.querySelector('.numpad').addEventListener('click', (e) => {
    const btn = e.target;
    if (!btn.classList.contains('btn')) return;

    const value = btn.value;
    const action = btn.dataset.action;

    if (action === 'clear') {
      currentInput = '';
    } else if (action === 'backspace') {
      currentInput = currentInput.slice(0, -1);
    } else if (action === 'equals') {
      try {
        if (currentInput) {
          const result = safeEvaluate(currentInput);
          const formattedResult = Number.isInteger(result) ? result.toString() : result.toFixed(8).replace(/\.?0+$/, '');
          addToHistory(currentInput, formattedResult);
          lastExpression = currentInput;
          currentInput = formattedResult;
        }
      } catch {
        currentInput = 'Error';
      }
    } else if (action === 'percent') {
      currentInput += '%';
    } else if (action === 'dot') {
      currentInput += '.';
    } else {
      currentInput += value;
    }

    display.value = currentInput || '0';
  });

  // Keyboard handler
  document.addEventListener('keydown', (e) => {
    const key = e.key;
    
    if (key >= '0' && key <= '9') currentInput += key;
    else if (['+', '-', '*', '/', '.', '%'].includes(key)) currentInput += key;
    else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      try {
        if (currentInput) {
          const result = safeEvaluate(currentInput);
          const formattedResult = Number.isInteger(result) ? result.toString() : result.toFixed(8).replace(/\.?0+$/, '');
          addToHistory(currentInput, formattedResult);
          lastExpression = currentInput;
          currentInput = formattedResult;
        }
      } catch {
        currentInput = 'Error';
      }
    } else if (key === 'Escape') {
      currentInput = '';
    } else if (key === 'Backspace') {
      currentInput = currentInput.slice(0, -1);
    }
    
    display.value = currentInput || '0';
  });

  // Event listeners
  themeToggle.addEventListener('click', toggleTheme);
  copyBtn.addEventListener('click', copyToClipboard);
  clearHistoryBtn.addEventListener('click', clearHistory);

  // Start app
  init();
})();
