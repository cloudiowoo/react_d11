/*
 * @Date: 2025-06-17 13:44:15
 * @LastEditors: cloudio cloudio.woo@gmail.com
 * @LastEditTime: 2025-07-06 15:47:21
 * @FilePath: /test_d11/web/themes/custom/react/react-src/src/main.jsx
 */
/*
 * @Date: 2025-06-17 13:44:15
 * @LastEditors: cloudio cloudio.woo@gmail.com
 * @LastEditTime: 2025-07-06 15:46:34
 * @FilePath: /test_d11/web/themes/custom/react/react-src/src/main.jsx
 */
import '@fontsource/poppins/300.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/questrial/400.css'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import theme from './styles/theme'

// 导入并初始化 i18n
import './i18n'

console.log('React: Starting initialization...')

// MUI 主题包装器组件
const AppWithTheme = ({ children }) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
)

// 主应用渲染
const container = document.getElementById('test-react-app')
if (container) {
  console.log('React: Container found, rendering app...')

  // 获取 Drupal 设置
  const drupalSettings = window.drupalSettings || {}

  console.log('React: Drupal data:', drupalSettings.react || {})

  const root = ReactDOM.createRoot(container)
  root.render(
    <React.StrictMode>
      <AppWithTheme>
        <App drupalData={drupalSettings.react || {}} />
      </AppWithTheme>
    </React.StrictMode>
  )
  console.log('React: App rendered successfully')
} else {
  console.error('React: Container element #test-react-app not found')
  // 尝试在 DOM 加载后再查找
  document.addEventListener('DOMContentLoaded', () => {
    const delayedContainer = document.getElementById('test-react-app')
    if (delayedContainer) {
      console.log('React: Container found after DOMContentLoaded, rendering app...')

      // 获取 Drupal 设置
      const drupalSettings = window.drupalSettings || {}

      console.log('React: Drupal data (delayed):', drupalSettings.react || {})

      const root = ReactDOM.createRoot(delayedContainer)
      root.render(
        <React.StrictMode>
          <AppWithTheme>
            <App drupalData={drupalSettings.react || {}} />
          </AppWithTheme>
        </React.StrictMode>
      )
    }
  })
}

console.log('React: Initialization complete')
