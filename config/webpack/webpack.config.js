// See the shakacode/shakapacker README and docs directory for advice on customizing your webpackConfig.
const path = require('path')
const { generateWebpackConfig, merge } = require('shakapacker')

const baseConfig = generateWebpackConfig()

// Add the `@/` alias -> app/javascript/app (mirrors tsconfig paths).
module.exports = merge(baseConfig, {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '..', '..', 'app', 'javascript', 'app')
    }
  }
})
