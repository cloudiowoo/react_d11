/*
 * @Date: 2025-01-15 14:30:00
 * @LastEditors: cloudio cloudio.woo@gmail.com
 * @LastEditTime: 2025-07-07 14:29:16
 * @FilePath: /test_d11/web/themes/custom/react/react-src/src/components/ArticleList.jsx
 */
import {
  Person as AuthorIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Link as MuiLink,
  Pagination,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import contentApiService from '../services/ContentApiService';
import Footer from './Footer';
import Navigation from './Navigation';

const ArticleList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // 状态管理
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 9
  });

  // 语言配置
  const languageConfig = {
    'en': { code: 'en', urlAlias: '' },
    'es': { code: 'es', urlAlias: '/es' },
    'zh-hans': { code: 'zh-hans', urlAlias: '/zh-hans' }
  };

  // 从URL检测当前语言
  const detectLanguageFromUrl = () => {
    const path = window.location.pathname;
    if (path.startsWith('/zh-hans')) return 'zh-hans';
    if (path.startsWith('/es')) return 'es';
    return 'en';
  };

  // 语言切换处理
  const handleLanguageChange = (newLanguage) => {
    if (newLanguage === currentLanguage) return;

    const newConfig = languageConfig[newLanguage];
    if (!newConfig) return;

    setCurrentLanguage(newLanguage);
    i18n.changeLanguage(newLanguage === 'zh-hans' ? 'zh-CN' : newLanguage);
    contentApiService.setCurrentLanguage(newLanguage);

    // 构建新的URL
    const currentPath = window.location.pathname;
    let cleanPath = currentPath;

    // 移除当前语言前缀
    Object.values(languageConfig).forEach(config => {
      if (config.urlAlias && currentPath.startsWith(config.urlAlias)) {
        cleanPath = currentPath.substring(config.urlAlias.length);
      }
    });

    // 添加新语言前缀
    const newPath = newConfig.urlAlias + cleanPath;
    window.history.pushState({}, '', newPath);

    // 重新加载数据
    loadArticlesData();
  };

  // 加载文章数据
  const loadArticlesData = async () => {
    try {
      setLoading(true);
      setError(null);

      const page = parseInt(searchParams.get('page')) || 1;

      console.log('[ArticleList] Loading articles with params:', { page, itemsPerPage: pagination.itemsPerPage });

      // 构建API查询参数 - 传递正确的page值，不需要减1
      const queryParams = {
        page: page, // 传递正确的页码值
        limit: pagination.itemsPerPage,
        sort: 'created',
        order: 'DESC'
      };

      console.log('[ArticleList] Final API query params:', queryParams);

      const articlesData = await contentApiService.getArticles(queryParams);

      console.log('[ArticleList] Articles API response:', articlesData);

      // 处理文章数据 - 更灵活地处理不同的API响应格式
      let articlesList = [];
      let paginationInfo = {
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: pagination.itemsPerPage
      };

      if (articlesData && articlesData.success) {
        // 处理成功的API响应格式
        if (articlesData.data && Array.isArray(articlesData.data)) {
          articlesList = articlesData.data;
          if (articlesData.pagination) {
            paginationInfo = {
              currentPage: articlesData.pagination.currentPage || page,
              totalPages: articlesData.pagination.totalPages || Math.ceil(articlesData.pagination.totalItems / pagination.itemsPerPage),
              totalItems: articlesData.pagination.totalItems || articlesList.length,
              itemsPerPage: articlesData.pagination.itemsPerPage || pagination.itemsPerPage
            };
          }
        } else {
          console.warn('[ArticleList] Unexpected articles API response format:', articlesData);
        }
      } else if (articlesData) {
        // 处理其他响应格式
        if (articlesData.items && Array.isArray(articlesData.items)) {
          articlesList = articlesData.items;
          if (articlesData.pagination) {
            paginationInfo = {
              currentPage: page,
              totalPages: articlesData.pagination.totalPages || Math.ceil(articlesData.pagination.total / pagination.itemsPerPage),
              totalItems: articlesData.pagination.total || articlesList.length,
              itemsPerPage: pagination.itemsPerPage
            };
          }
        } else if (Array.isArray(articlesData)) {
          // 如果直接返回数组
          articlesList = articlesData;
          paginationInfo = {
            currentPage: 1,
            totalPages: 1,
            totalItems: articlesList.length,
            itemsPerPage: pagination.itemsPerPage
          };
        } else {
          console.warn('[ArticleList] Unexpected articles API response format:', articlesData);
        }
      }

      console.log('[ArticleList] Processed articles list:', articlesList);
      console.log('[ArticleList] Pagination info:', paginationInfo);

      setArticles(articlesList);
      setPagination(paginationInfo);

    } catch (err) {
      console.error('[ArticleList] 加载文章数据失败:', err);
      setError(err.message || '加载文章失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化
  useEffect(() => {
    const detectedLanguage = detectLanguageFromUrl();
    setCurrentLanguage(detectedLanguage);
    i18n.changeLanguage(detectedLanguage === 'zh-hans' ? 'zh-CN' : detectedLanguage);
    contentApiService.setCurrentLanguage(detectedLanguage);
    loadArticlesData();
  }, [searchParams]);

  // 分页处理
  const handlePageChange = (event, page) => {
    const newParams = new URLSearchParams(searchParams);
    if (page > 1) {
      newParams.set('page', page.toString());
    } else {
      newParams.delete('page');
    }
    setSearchParams(newParams);
  };

  // 获取图片URL
  const getImageUrl = (imageField) => {
    if (!imageField) return null;

    if (imageField.url) {
      if (imageField.image_styles) {
        return imageField.image_styles.medium ||
               imageField.image_styles.large ||
               imageField.url;
      }
      return imageField.url;
    }
    return null;
  };

  // 生成文章链接URL
  const getArticleUrl = (article) => {
    const langConfig = languageConfig[currentLanguage];
    const basePath = langConfig.urlAlias || '';

    // 如果文章有URL字段，提取URL别名
    if (article && typeof article === 'object' && article.url) {
      const urlPath = new URL(article.url).pathname;
      // 提取 /articles/xxx 中的 xxx 部分
      const match = urlPath.match(/\/articles\/(.+)$/) || urlPath.match(/\/article\/(.+)$/);
      if (match) {
        return `${basePath}/articles/${match[1]}`;
      }
    }

    // 否则使用ID
    const articleId = typeof article === 'object' ? article.id : article;
    return `${basePath}/articles/${articleId}`;
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage === 'zh-hans' ? 'zh-CN' : currentLanguage, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 渲染面包屑导航
  const renderBreadcrumb = () => (
    <Box sx={{ py: 2, borderBottom: '1px solid #eee' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.875rem' }}>
          <MuiLink
            component={Link}
            to={languageConfig[currentLanguage].urlAlias || '/'}
            sx={{ color: '#666', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {t('navigation.home', 'Home')}
          </MuiLink>
          <Typography sx={{ color: '#999' }}>›</Typography>
          <Typography sx={{ color: '#333' }}>
            {t('navigation.articles', 'Articles')}
          </Typography>
        </Box>
      </Container>
    </Box>
  );

  // 渲染页面标题
  const renderPageTitle = () => (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', maxWidth: '600px', mx: 'auto' }}>
        <Typography variant="h1" component="h1" sx={{
          fontFamily: 'Georgia, serif',
          fontWeight: 'normal',
          color: '#333',
          fontSize: { xs: '2.5rem', md: '3.5rem' },
          lineHeight: 1.2,
          mb: 3
        }}>
          {t('articles.title', 'Articles')}
        </Typography>

        <Typography variant="h5" component="p" sx={{
          color: '#666',
          fontSize: { xs: '1rem', md: '1.2rem' },
          lineHeight: 1.5,
          mb: 4
        }}>
          {t('articles.subtitle', 'Discover interesting stories, tips, and insights about food and cooking.')}
        </Typography>

        {/* 结果统计 */}
        <Typography variant="body2" sx={{ color: '#999' }}>
          {t('articles.resultsCount', 'Found {{count}} articles', { count: pagination.totalItems })}
        </Typography>
      </Box>
    </Container>
  );

  // 渲染文章卡片
  const renderArticleCard = (article) => {
    const articleImage = getImageUrl(article.fields?.field_image?.image || article.fields?.field_media_image?.image);

    // 修复作者字段的处理 - 防止渲染对象
    let author = t('articles.unknownAuthor', 'Unknown Author');
    if (article.fields?.field_author) {
      const authorField = article.fields.field_author;
      if (typeof authorField === 'string') {
        author = authorField;
      } else if (authorField.value && typeof authorField.value === 'string') {
        author = authorField.value;
      } else if (authorField.name && typeof authorField.name === 'string') {
        author = authorField.name;
      } else if (authorField.data && authorField.data.name && typeof authorField.data.name === 'string') {
        author = authorField.data.name;
      } else {
        console.warn('无法解析作者字段:', authorField);
      }
    } else if (article.author && typeof article.author === 'string') {
      author = article.author;
    }

    const publishDate = article.created || article.fields?.created?.value;

    // 修复阅读时间字段的处理
    let readTime = 5; // 默认5分钟
    if (article.fields?.field_read_time) {
      const readTimeField = article.fields.field_read_time;
      if (typeof readTimeField === 'number') {
        readTime = readTimeField;
      } else if (readTimeField.value && typeof readTimeField.value === 'number') {
        readTime = readTimeField.value;
      } else if (readTimeField.value && typeof readTimeField.value === 'string') {
        const parsedTime = parseInt(readTimeField.value, 10);
        readTime = isNaN(parsedTime) ? 5 : parsedTime;
      }
    }

    // 修复摘要字段的处理
    let summary = '';
    if (article.summary && typeof article.summary === 'string') {
      summary = article.summary;
    } else if (article.fields?.field_summary) {
      const summaryField = article.fields.field_summary;
      if (typeof summaryField === 'string') {
        summary = summaryField;
      } else if (summaryField.value && typeof summaryField.value === 'string') {
        summary = summaryField.value;
      } else if (summaryField.processed && typeof summaryField.processed === 'string') {
        // 移除HTML标签
        summary = summaryField.processed.replace(/<[^>]*>/g, '');
      }
    }

    return (
      <Box
        key={article.id}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'white',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
          }
        }}
      >
        {/* 文章图片 */}
        {articleImage && (
          <Box sx={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden' }}>
            <img
              src={articleImage}
              alt={article.title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>
        )}

        {/* 文章信息 */}
        <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* 标题 */}
          <Typography variant="h6" component="h3" sx={{
            fontFamily: 'Georgia, serif',
            fontWeight: 'normal',
            fontSize: '1.25rem',
            lineHeight: 1.3,
            mb: 2,
            color: '#333',
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            <Link
              to={getArticleUrl(article)}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                '&:hover': { color: '#E84E1B' }
              }}
            >
              {article.title}
            </Link>
          </Typography>

          {/* 摘要 */}
          {summary && (
            <Typography variant="body2" sx={{
              color: '#666',
              lineHeight: 1.5,
              mb: 3,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {summary}
            </Typography>
          )}

          {/* 文章元信息 */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            pt: 2,
            borderTop: '1px solid #eee',
            flexWrap: 'wrap',
            gap: 1
          }}>
            {/* 作者 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AuthorIcon sx={{ fontSize: 16, color: '#666' }} />
              <Typography variant="body2" sx={{ color: '#666' }}>
                {author}
              </Typography>
            </Box>

            {/* 发布日期 */}
            {publishDate && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimeIcon sx={{ fontSize: 16, color: '#666' }} />
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {formatDate(publishDate)}
                </Typography>
              </Box>
            )}

            {/* 阅读时间 */}
            <Typography variant="body2" sx={{ color: '#666' }}>
              {t('articles.readTime', '{{minutes}} min read', { minutes: readTime })}
            </Typography>
          </Box>

          {/* 查看文章按钮 */}
          <Button
            component={Link}
            to={getArticleUrl(article)}
            variant="outlined"
            size="small"
            sx={{
              borderColor: '#E84E1B',
              color: '#E84E1B',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: '#E84E1B',
                color: 'white'
              }
            }}
          >
            {t('articles.viewArticle', 'VIEW ARTICLE')} ›
          </Button>
        </Box>
      </Box>
    );
  };

  // 渲染文章网格
  const renderArticlesGrid = () => (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
      {articles.length > 0 ? (
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          justifyContent: { xs: 'center', md: 'flex-start' }
        }}>
          {articles.map((article) => (
            <Box
              key={article.id}
              sx={{
                flex: {
                  xs: '1 1 100%',                    // 手机：1列
                  sm: '1 1 calc(50% - 12px)',        // 平板：2列
                  md: '1 1 calc(33.333% - 16px)'     // 桌面及以上：3列（9条数据，3x3布局）
                },
                minWidth: { xs: '280px', sm: '300px' },
                maxWidth: { xs: '400px', sm: 'none' }
              }}
            >
              {renderArticleCard(article)}
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
            {t('articles.noResults', 'No articles found')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#999' }}>
            {t('articles.checkBackLater', 'Please check back later for new articles')}
          </Typography>
        </Box>
      )}
    </Container>
  );

  // 渲染分页
  const renderPagination = () => (
    pagination.totalPages > 1 && (
      <Container maxWidth="lg" sx={{ pb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={handlePageChange}
            color="primary"
            size={isMobile ? 'small' : 'medium'}
            sx={{
              '& .MuiPaginationItem-root': {
                '&.Mui-selected': {
                  bgcolor: '#E84E1B',
                  '&:hover': {
                    bgcolor: '#d63916'
                  }
                }
              }
            }}
          />
        </Box>
      </Container>
    )
  );

  // 主渲染
  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Navigation
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          activeTab="articles"
        />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {t('articles.loadError', 'Failed to load articles')}: {error}
          </Alert>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navigation
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        activeTab="articles"
      />

      {renderBreadcrumb()}
      {renderPageTitle()}

      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            {t('common.loading', '加载中...')}
          </Typography>
        </Box>
      ) : (
        <>
          {renderArticlesGrid()}
          {renderPagination()}
        </>
      )}

      <Footer />
    </Box>
  );
};

export default ArticleList;
