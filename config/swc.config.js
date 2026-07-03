// Custom swc-loader options, merged into Shakapacker's swc rule.
// Enables React 18's automatic JSX runtime so components don't need `import React`.
module.exports = {
  options: {
    jsc: {
      transform: {
        react: {
          runtime: "automatic"
        }
      }
    }
  }
}
