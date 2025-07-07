import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import ArticleDetail from './components/ArticleDetail'
import ArticleList from './components/ArticleList'
import HomePage from './components/HomePage'
import RecipeDetail from './components/RecipeDetail'
import RecipeList from './components/RecipeList'
import { initializeLanguage } from './utils/drupalLanguageSync'

function App({ drupalData = {} }) {
  const { i18n } = useTranslation()
  const [currentLang, setCurrentLang] = useState(i18n.language || 'zh-CN')

  // 从Drupal数据中提取信息
  const { nodeId, nodeType, pagePath, language } = drupalData

  // 初始化语言设置
  useEffect(() => {
    const initLang = initializeLanguage()
    if (initLang !== i18n.language) {
      i18n.changeLanguage(initLang)
    }
  }, [i18n])

  // 监听语言变化
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setCurrentLang(lng)
    }

    i18n.on('languageChanged', handleLanguageChange)
    return () => {
      i18n.off('languageChanged', handleLanguageChange)
    }
  }, [i18n])

  return (
    <div className="App">
      <Router>
        <Routes>
          {/* 英语路由 */}
          <Route path="/" element={<HomePage />} />
          <Route path="/recipes" element={<RecipeList />} />
          <Route path="/recipes/:recipeId" element={<RecipeDetail />} />
          <Route path="/articles" element={<ArticleList />} />
          <Route path="/articles/:articleId" element={<ArticleDetail />} />

          {/* 西班牙语路由 */}
          <Route path="/es" element={<HomePage />} />
          <Route path="/es/recipes" element={<RecipeList />} />
          <Route path="/es/recipes/:recipeId" element={<RecipeDetail />} />
          <Route path="/es/articles" element={<ArticleList />} />
          <Route path="/es/articles/:articleId" element={<ArticleDetail />} />

          {/* 中文路由 */}
          <Route path="/zh-hans" element={<HomePage />} />
          <Route path="/zh-hans/recipes" element={<RecipeList />} />
          <Route path="/zh-hans/recipes/:recipeId" element={<RecipeDetail />} />
          <Route path="/zh-hans/articles" element={<ArticleList />} />
          <Route path="/zh-hans/articles/:articleId" element={<ArticleDetail />} />

          {/* 其他路由默认到首页 */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
