/*
 * @Date: 2025-01-15 14:30:00
 * @LastEditors: cloudio cloudio.woo@gmail.com
 * @LastEditTime: 2025-07-07 14:00:07
 * @FilePath: /test_d11/web/themes/custom/react/react-src/src/components/ArticleDetail.jsx
 */
import {
  CalendarToday as DateIcon,
  AccessTime as ReadTimeIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Link as MuiLink,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import contentApiService from '../services/ContentApiService';
import Footer from './Footer';
import Navigation from './Navigation';

const ArticleDetail = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t, i18n } = useTranslation();
  const { articleId, urlAlias } = useParams();

  // 状态管理
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('en');

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
    loadArticleData();
  };

  // 加载文章数据
  const loadArticleData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 检测articleId是数字还是URL别名
      const isNumericId = /^\d+$/.test(articleId);

      // 如果articleId不是数字，那么它就是URL别名
      const actualUrlAlias = isNumericId ? urlAlias : articleId;

      console.log('Loading article data:', { articleId, urlAlias, isNumericId, actualUrlAlias });

      const [articleData, categoriesData] = await Promise.all([
        isNumericId
          ? contentApiService.getArticle(articleId)
          : contentApiService.getArticleByUrlAlias(actualUrlAlias),
        contentApiService.getArticleCategories({ limit: 20 })
      ]);

      console.log('Article data:', articleData);
      setArticle(articleData);
      setCategories(categoriesData.data || categoriesData.items || []);

      // 加载相关文章 - 修复查询逻辑
      if (articleData) {
        let categoryId = null;

        // 尝试从不同的字段结构中获取分类ID
        if (articleData.fields?.field_article_category) {
          const categoryField = articleData.fields.field_article_category;

          // 处理不同的分类字段格式
          if (categoryField.data && categoryField.data.id) {
            categoryId = categoryField.data.id;
          } else if (categoryField.target_id) {
            categoryId = categoryField.target_id;
          } else if (categoryField.id) {
            categoryId = categoryField.id;
          } else if (typeof categoryField === 'string' || typeof categoryField === 'number') {
            categoryId = categoryField;
          }
        }

        console.log('Article category analysis:', {
          articleId: articleData.id,
          categoryField: articleData.fields?.field_article_category,
          extractedCategoryId: categoryId
        });

        // 如果有分类ID，获取相关文章
        if (categoryId) {
          try {
            const relatedData = await contentApiService.getArticlesByCategory(categoryId, articleData.id, 3);
            console.log('Related articles data:', relatedData);
            setRelatedArticles(relatedData || []);
          } catch (relatedError) {
            console.error('加载相关文章失败:', relatedError);
            // 如果按分类获取失败，尝试获取最新的文章作为相关文章
            try {
              const latestArticles = await contentApiService.getArticles({ limit: 4 });
              const filteredArticles = (latestArticles.data || []).filter(
                article => article.id !== articleData.id
              ).slice(0, 3);
              console.log('Using latest articles as related:', filteredArticles);
              setRelatedArticles(filteredArticles);
            } catch (fallbackError) {
              console.error('获取最新文章也失败:', fallbackError);
              setRelatedArticles([]);
            }
          }
        } else {
          // 如果没有分类，直接获取最新的文章作为相关文章
          console.log('No category found, fetching latest articles as related');
          try {
            const latestArticles = await contentApiService.getArticles({ limit: 4 });
            const filteredArticles = (latestArticles.data || []).filter(
              article => article.id !== articleData.id
            ).slice(0, 3);
            console.log('Latest articles as related:', filteredArticles);
            setRelatedArticles(filteredArticles);
          } catch (latestError) {
            console.error('获取最新文章失败:', latestError);
            setRelatedArticles([]);
          }
        }
      }

    } catch (err) {
      console.error('加载文章数据失败:', err);
      setError(err.message);
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
    loadArticleData();
  }, [articleId]);

  // 搜索处理
  const handleSearch = (query) => {
    console.log('搜索:', query);
  };

  // 获取图片URL
  const getImageUrl = (imageField) => {
    if (!imageField) return null;

    if (imageField.url) {
      if (imageField.image_styles) {
        return imageField.image_styles.large ||
               imageField.image_styles.medium ||
               imageField.url;
      }
      return imageField.url;
    }
    return null;
  };

  // 获取分类名称
  const getCategoryName = (categoryData) => {
    if (!categoryData?.data?.id) return null;
    const categoryId = categoryData.data.id;
    const categoryEntity = article?.included?.find(item => item.id === categoryId);
    return categoryEntity?.attributes?.name || null;
  };

  // 生成文章链接URL
  const getArticleUrl = (articleData) => {
    const langConfig = languageConfig[currentLanguage];
    const basePath = langConfig.urlAlias || '';

    // 如果传入的是文章对象且有URL字段，提取URL别名
    if (articleData && typeof articleData === 'object' && articleData.url) {
      const urlPath = new URL(articleData.url).pathname;
      // 提取 /articles/xxx 中的 xxx 部分
      const match = urlPath.match(/\/articles\/(.+)$/);
      if (match) {
        return `${basePath}/articles/${match[1]}`;
      }
    }

    // 否则使用ID
    const articleId = typeof articleData === 'object' ? articleData.id : articleData;
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
            Home
          </MuiLink>
          <Typography sx={{ color: '#999' }}>›</Typography>
          <MuiLink
            component={Link}
            to={`${languageConfig[currentLanguage].urlAlias || ''}/articles`}
            sx={{ color: '#666', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Articles
          </MuiLink>
          <Typography sx={{ color: '#999' }}>›</Typography>
          <Typography sx={{ color: '#333' }}>
            {article?.title || 'Article'}
          </Typography>
        </Box>
      </Container>
    </Box>
  );

  // 渲染文章头部信息
  const renderArticleHeader = () => {
    if (!article) return null;

    const categoryName = getCategoryName(article.fields?.field_article_category);
    const articleImage = getImageUrl(article.fields?.field_media_image?.image);

    // 修复标签数据处理 - 确保正确处理不同的数据结构
    let tags = [];
    if (article.fields?.field_tags) {
      if (Array.isArray(article.fields.field_tags)) {
        // 如果field_tags是数组，直接使用
        tags = article.fields.field_tags;
      } else if (article.fields.field_tags.data && Array.isArray(article.fields.field_tags.data)) {
        // 如果field_tags有data属性且是数组
        tags = article.fields.field_tags.data;
      } else if (article.fields.field_tags.value && Array.isArray(article.fields.field_tags.value)) {
        // 如果field_tags有value属性且是数组
        tags = article.fields.field_tags.value;
      }
    }

    // 修复作者字段的处理 - 防止渲染对象
    let author = 'Megan Collins';
    if (article.author?.display_name && typeof article.author.display_name === 'string') {
      author = article.author.display_name;
    } else if (article.fields?.field_author) {
      const authorField = article.fields.field_author;
      if (typeof authorField === 'string') {
        author = authorField;
      } else if (authorField.value && typeof authorField.value === 'string') {
        author = authorField.value;
      } else if (authorField.name && typeof authorField.name === 'string') {
        author = authorField.name;
      } else if (authorField.data?.name && typeof authorField.data.name === 'string') {
        author = authorField.data.name;
      } else {
        console.warn('无法解析作者字段:', authorField);
      }
    }

    const publishDate = formatDate(article.created || article.fields?.field_publish_date?.value);

    // 修复阅读时间字段的处理 - 防止渲染对象
    let readTime = '2 min read';
    if (article.fields?.field_read_time) {
      const readTimeField = article.fields.field_read_time;
      if (typeof readTimeField === 'string') {
        readTime = readTimeField;
      } else if (readTimeField.value) {
        if (typeof readTimeField.value === 'string') {
          readTime = readTimeField.value;
        } else if (typeof readTimeField.value === 'number') {
          readTime = `${readTimeField.value} min read`;
        }
      } else {
        console.warn('无法解析阅读时间字段:', readTimeField);
      }
    }

    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* 主要内容区域 - 使用Box布局 */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 4,
          alignItems: 'flex-start'
        }}>
          {/* 左侧：文章内容 */}
          <Box sx={{
            flex: { xs: '1 1 100%', md: '1 1 66%' },
            maxWidth: { xs: '100%', md: '66%' }
          }}>
            {/* 标题 */}
            <Typography variant="h3" component="h1" gutterBottom sx={{
              fontFamily: 'Georgia, serif',
              fontWeight: 'normal',
              color: '#333',
              fontSize: { xs: '2rem', md: '2.5rem' },
              lineHeight: 1.2,
              mb: 3
            }}>
              {article.title}
            </Typography>

            {/* 作者和发布信息 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  by
                </Typography>
                <Typography variant="body2" sx={{ color: '#E84E1B', fontWeight: 'bold' }}>
                  {author}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DateIcon sx={{ fontSize: 16, color: '#666' }} />
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {publishDate}
                </Typography>
              </Box>

              {readTime && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReadTimeIcon sx={{ fontSize: 16, color: '#666' }} />
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {readTime}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* 主图片 */}
            {articleImage && (
              <Box sx={{ mb: 4 }}>
                <img
                  src={articleImage}
                  alt={article.title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '400px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              </Box>
            )}

            {/* 文章内容 */}
            <Box sx={{
              '& p': {
                mb: 2,
                lineHeight: 1.7,
                color: '#333',
                fontSize: '1.1rem'
              },
              '& h2, & h3, & h4': {
                mt: 4,
                mb: 2,
                fontFamily: 'Georgia, serif',
                fontWeight: 'normal',
                color: '#333'
              },
              '& h2': {
                fontSize: '1.8rem'
              },
              '& h3': {
                fontSize: '1.5rem'
              },
              '& ul, & ol': {
                mb: 2,
                pl: 3,
                '& li': {
                  mb: 1,
                  lineHeight: 1.6,
                  color: '#333'
                }
              },
              '& blockquote': {
                borderLeft: '4px solid #E84E1B',
                pl: 3,
                py: 2,
                my: 3,
                backgroundColor: '#f9f9f9',
                fontStyle: 'italic',
                color: '#666'
              },
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '8px',
                my: 2
              }
            }}>
              <div dangerouslySetInnerHTML={{
                __html: article.fields?.field_body?.processed ||
                       article.fields?.field_body?.value ||
                       article.body?.processed ||
                       article.body?.value ||
                       ''
              }} />
            </Box>

            {/* 标签 */}
            {tags.length > 0 && (
              <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #eee' }}>
                <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                  {t('article.tags', 'Tags')}:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {tags.map((tag, index) => {
                    // 安全地获取标签名称，处理不同的数据结构
                    let tagName = 'Tag';
                    let tagId = index;

                    if (typeof tag === 'string') {
                      tagName = tag;
                      tagId = index;
                    } else if (typeof tag === 'object' && tag !== null) {
                      if (tag.name) {
                        tagName = tag.name;
                        tagId = tag.id || index;
                      } else if (tag.attributes?.name) {
                        tagName = tag.attributes.name;
                        tagId = tag.id || index;
                      } else if (tag.value) {
                        tagName = tag.value;
                        tagId = tag.id || index;
                      } else {
                        // 如果无法从对象中提取名称，跳过这个标签
                        console.warn('无法解析标签对象:', tag);
                        return null;
                      }
                    }

                    return (
                      <Chip
                        key={tagId}
                        label={tagName}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderColor: '#E84E1B',
                          color: '#E84E1B',
                          '&:hover': {
                            backgroundColor: '#E84E1B',
                            color: 'white'
                          }
                        }}
                      />
                    );
                  }).filter(Boolean)} {/* 过滤掉null值 */}
                </Box>
              </Box>
            )}
          </Box>

          {/* 右侧：相关文章 */}
          <Box sx={{
            flex: { xs: '1 1 100%', md: '1 1 33%' },
            maxWidth: { xs: '100%', md: '33%' },
            position: { md: 'sticky' },
            top: { md: 20 },
            mt: { xs: 4, md: 0 }
          }}>
            {/* More featured articles 部分 */}
            <Typography variant="h5" component="h2" gutterBottom sx={{
              fontFamily: 'Georgia, serif',
              fontWeight: 'normal',
              color: '#333',
              fontSize: '1.5rem',
              mb: 3
            }}>
              {t('article.moreFeaturedArticles', 'More featured articles')}
            </Typography>

            {relatedArticles.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {relatedArticles.map((relatedArticle) => {
                  const relatedImage = getImageUrl(relatedArticle.fields?.field_media_image?.image);

                  return (
                    <Box key={relatedArticle.id} sx={{ pb: 3, borderBottom: '1px solid #eee' }}>
                      {/* 文章图片 */}
                      {relatedImage && (
                        <Box sx={{ mb: 2 }}>
                          <img
                            src={relatedImage}
                            alt={relatedArticle.title}
                            style={{
                              width: '100%',
                              height: '160px',
                              objectFit: 'cover',
                              borderRadius: '8px'
                            }}
                          />
                        </Box>
                      )}

                      {/* 文章标题 */}
                      <Typography variant="h6" component="h3" sx={{
                        fontFamily: 'Georgia, serif',
                        fontWeight: 'normal',
                        fontSize: '1.1rem',
                        lineHeight: 1.3,
                        mb: 2,
                        color: '#333'
                      }}>
                        <Link
                          to={getArticleUrl(relatedArticle)}
                          style={{
                            textDecoration: 'none',
                            color: 'inherit',
                            '&:hover': { color: '#E84E1B' }
                          }}
                        >
                          {relatedArticle.title}
                        </Link>
                      </Typography>

                      {/* VIEW ARTICLE 链接 */}
                      <Button
                        component={Link}
                        to={getArticleUrl(relatedArticle)}
                        variant="text"
                        size="small"
                        sx={{
                          color: '#E84E1B',
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          p: 0,
                          minWidth: 'auto',
                          '&:hover': {
                            bgcolor: 'transparent',
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {t('article.viewArticle', 'VIEW ARTICLE')} ›
                      </Button>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                {t('article.noRelatedArticles', 'No related articles available')}
              </Typography>
            )}
          </Box>
        </Box>
      </Container>
    );
  };

  // 主渲染
  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Navigation
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          onSearch={handleSearch}
          activeTab="articles"
        />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            加载文章失败: {error}
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
        onSearch={handleSearch}
        activeTab="articles"
      />

      {renderBreadcrumb()}

      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            加载中...
          </Typography>
        </Box>
      ) : (
        <>
          {renderArticleHeader()}
          <Footer />
        </>
      )}
    </Box>
  );
};

export default ArticleDetail;
