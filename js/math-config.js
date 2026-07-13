window.MathJax = {
  tex: {
    inlineMath: [['$', '$']],
    displayMath: [['$$', '$$']]
  },
  startup: {
    // We disable automatic typesetting because we need to manually 
    // trigger it AFTER our JavaScript injects the JSON data into the HTML.
    typeset: false 
  }
};
