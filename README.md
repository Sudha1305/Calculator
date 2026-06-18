# 🧮 JavaScript Calculator

A modern, responsive calculator built with **HTML, CSS, and JavaScript**.  
It features a custom safe evaluator, keyboard support, and a sleek aquamarine-on-dark UI.


## ✨ Features
- **Basic arithmetic**: Addition, subtraction, multiplication, division
- **Percent function**: Quickly convert numbers into percentages
- **Backspace & Clear**: Correct mistakes or reset easily
- **Keyboard support**: Digits, operators, Enter, Backspace, Escape, `%`
- **Safe evaluation**: Custom parser avoids `eval()` for security
- **Responsive design**: Works across devices with media queries
- **Stylish UI**: Dark background with aquamarine accents and hover effects

  
Project Structure
├── index.html   # Main HTML file
├── style.css    # Styling for calculator
└── script.js    # Calculator logic


## 🚀 Getting Started
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/js-calculator.git
   
2.Navigate into the project folder:
bash
cd js-calculator

3.Open index.html in your browser.


UI Preview:
Here’s how the calculator looks:

<img width="1877" height="836" alt="image" src="https://github.com/user-attachments/assets/3d13f20d-baab-4685-8fbb-c1eec0e42c3d" />


🛠️ Technologies Used:
- HTML5 for structure
- CSS3 for styling and responsiveness
- JavaScript for functionality

📖 How It Works
- Input handling: Buttons and keyboard events trigger handleKey()
- Expression building: Operators and digits update state.expression
- Evaluation: safeEvaluate() parses and computes without using eval
- Display updates: Managed by setDisplay() for consistent UI feedback








