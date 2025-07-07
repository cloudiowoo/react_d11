import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Container,
  Grid,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import contentApiService from '../services/ContentApiService';
import Footer from './Footer';
import Navigation from './Navigation';
import RecipeCollections from './RecipeCollections';

const HomePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t, i18n } = useTranslation();

  // 状态管理
  const [recipes, setRecipes] = useState([]);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredContent, setFeaturedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('en'); // 默认语言设为英语
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [contentStats, setContentStats] = useState(null);

  // 语言配置 - 与Drupal后端保持一致
  const languageConfig = {
    'en': {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      urlAlias: '', // 根路径 /
      flag: '🇺🇸'
    },
    'es': {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      urlAlias: '/es',
      flag: '🇪🇸'
    },
    'zh-hans': {
      code: 'zh-hans',
      name: 'Chinese (Simplified)',
      nativeName: '简体中文',
      urlAlias: '/zh-hans',
      flag: '🇨🇳'
    }
  };

  // 从URL检测当前语言
  const detectLanguageFromUrl = () => {
    const path = window.location.pathname;

    if (path.startsWith('/zh-hans')) {
      return 'zh-hans';
    }
    if (path.startsWith('/es')) {
      return 'es';
    }
    // 默认为英语（根路径或其他路径）
    return 'en';
  };

  // 语言切换处理
  const handleLanguageChange = (newLanguage) => {
    if (newLanguage === currentLanguage) return;

    const newConfig = languageConfig[newLanguage];
    if (!newConfig) return;

    // 更新状态
    setCurrentLanguage(newLanguage);

    // 更新i18n语言
    i18n.changeLanguage(newLanguage === 'zh-hans' ? 'zh-CN' : newLanguage);

    // 更新ContentApiService的语言设置
    contentApiService.setCurrentLanguage(newLanguage);

    // 构建新的URL
    const currentPath = window.location.pathname;
    const currentParams = window.location.search;

    // 移除当前语言前缀
    let cleanPath = currentPath;
    Object.values(languageConfig).forEach(config => {
      if (config.urlAlias && currentPath.startsWith(config.urlAlias)) {
        cleanPath = currentPath.substring(config.urlAlias.length) || '/';
      }
    });

    // 添加新语言前缀
    const newPath = newConfig.urlAlias + cleanPath;
    const newUrl = newPath + currentParams;

    // 更新URL并重新加载数据
    window.history.pushState({}, '', newUrl);

    // 重新加载页面数据
    initializeData();
  };

  // 初始化数据
  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 语言已经在调用此函数之前设置，这里不需要重复设置
      // contentApiService.setCurrentLanguage(currentLanguage);

      // 并行加载所有数据
      const [
        recipesData,
        articlesData,
        categoriesData,
        languagesData
      ] = await Promise.all([
        contentApiService.getRecipes({ limit: 12 }),
        contentApiService.getArticles({ limit: 6 }),
        contentApiService.getRecipeCategories({ limit: 20 }),
        contentApiService.getAvailableLanguages()
      ]);

      console.log('Recipes data:', recipesData);
      console.log('Articles data:', articlesData);
      console.log('Categories data:', categoriesData);
      console.log('Languages data:', languagesData);

      // 设置数据
      setRecipes(recipesData.data || recipesData.items || []);
      setArticles(articlesData.data || articlesData.items || []);
      setCategories(categoriesData.data || categoriesData.items || []);
      setAvailableLanguages(languagesData || []);

    } catch (err) {
      console.error('初始化数据失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始化语言和数据
  useEffect(() => {
    const detectedLanguage = detectLanguageFromUrl();
    setCurrentLanguage(detectedLanguage);

    // 设置i18n语言
    i18n.changeLanguage(detectedLanguage === 'zh-hans' ? 'zh-CN' : detectedLanguage);

    // 先设置 ContentApiService 的语言，再初始化数据
    contentApiService.setCurrentLanguage(detectedLanguage);

    // 然后初始化数据
    initializeData();
  }, []);

  // 监听浏览器前进后退
  useEffect(() => {
    const handlePopState = () => {
      const detectedLanguage = detectLanguageFromUrl();
      if (detectedLanguage !== currentLanguage) {
        setCurrentLanguage(detectedLanguage);
        // 先设置语言，再初始化数据
        contentApiService.setCurrentLanguage(detectedLanguage);
        initializeData();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentLanguage]);

  // 搜索处理
  const handleSearch = async (query) => {
    if (!query.trim()) {
      // 重置为原始数据
      const recipesData = await contentApiService.getRecipes({ limit: 12 });
      setRecipes(recipesData.data || []);
      return;
    }

    try {
      const results = await contentApiService.searchContent(query, 'recipe');
      setRecipes(results);
    } catch (err) {
      console.error('搜索失败:', err);
    }
  };

  // 分类过滤
  const handleCategoryFilter = async (categoryId) => {
    setSelectedCategory(categoryId);

    if (!categoryId) {
      // 显示所有食谱
      const recipesData = await contentApiService.getRecipes({ limit: 12 });
      setRecipes(recipesData.data || []);
      return;
    }

    try {
      const filteredRecipes = await contentApiService.getRecipes({
        'filter[field_recipe_category.id]': categoryId,
        limit: 12
      });
      setRecipes(filteredRecipes.data || []);
    } catch (err) {
      console.error('分类过滤失败:', err);
    }
  };

  // 获取图片URL - 更新为适配新的API格式
  const getImageUrl = (imageField) => {
    if (!imageField) return null;

    // 新的API格式：直接返回图片对象，包含url和image_styles
    if (imageField.url) {
      // 优先使用适合的图片样式，如果没有则使用原始URL
      if (imageField.image_styles) {
        // 根据使用场景选择合适的图片样式
        return imageField.image_styles.large ||
               imageField.image_styles.medium ||
               imageField.url;
      }
      return imageField.url;
    }

    // 处理旧格式的兼容性（如果API还有旧格式数据）
    if (imageField.data && Array.isArray(imageField.data)) {
      const imageId = imageField.data.id;
      const imageEntity = featuredContent?.included.find(item => item.id === imageId);

      if (imageEntity && imageEntity.attributes && imageEntity.attributes.uri) {
        const uri = imageEntity.attributes.uri.url;
        return uri.startsWith('http') ? uri : `${window.location.origin}${uri}`;
      }
    }

    return null;
  };

  // 获取分类名称
  const getCategoryName = (categoryData, included = []) => {
    if (!categoryData || !categoryData.data) return null;

    const categoryId = categoryData.data.id;
    const categoryEntity = included.find(item => item.id === categoryId);

    if (categoryEntity && categoryEntity.attributes && categoryEntity.attributes.name) {
      return categoryEntity.attributes.name;
    }

    return null;
  };

  // 默认数据 - 当API数据不可用时使用
  const getDefaultRecipes = () => [
    {
      id: 'default-1',
      title: 'Super easy vegetarian pasta bake',
      fields: {
        field_summary: {
          processed: 'A wholesome pasta bake is the ultimate comfort food. This delicious bake is super quick to prepare and an ideal midweek meal for all the family.',
          value: 'A wholesome pasta bake is the ultimate comfort food. This delicious bake is super quick to prepare and an ideal midweek meal for all the family.'
        },
        field_media_image: null
      }
    },
    {
      id: 'default-2',
      title: 'Borscht with pork ribs',
      fields: {
        field_summary: {
          processed: 'This hearty borscht soup with tender pork ribs is perfect for cold winter days.',
          value: 'This hearty borscht soup with tender pork ribs is perfect for cold winter days.'
        },
        field_media_image: null
      }
    },
    {
      id: 'default-3',
      title: 'Fiery chili sauce',
      fields: {
        field_summary: {
          processed: 'A spicy homemade chili sauce that adds heat to any dish.',
          value: 'A spicy homemade chili sauce that adds heat to any dish.'
        },
        field_media_image: null
      }
    }
  ];

  const getDefaultArticles = () => [
    {
      id: 'default-article-1',
      title: 'Give your oatmeal the ultimate makeover',
      fields: {
        field_summary: {
          processed: 'Transform your morning routine with these creative and delicious oatmeal recipes that will make you excited to get out of bed.',
          value: 'Transform your morning routine with these creative and delicious oatmeal recipes that will make you excited to get out of bed.'
        },
        field_media_image: null
      }
    }
  ];

  const getDefaultCategories = () => [
    { id: 'cat-1', label: 'Alcohol free' },
    { id: 'cat-2', label: 'Cake' },
    { id: 'cat-3', label: 'Dairy-free' },
    { id: 'cat-4', label: 'Feel' }
  ];

  // 生成食谱链接URL
  const getRecipeUrl = (recipeId) => {
    const langConfig = languageConfig[currentLanguage];
    const basePath = langConfig.urlAlias || '';
    return `${basePath}/recipes/${recipeId}`;
  };

  // 渲染Hero Section
  const renderHeroSection = () => {
    // 从displayRecipes中获取第一个食谱作为hero
    const heroRecipe = displayRecipes[0];

    if (!heroRecipe) {
      console.log('No hero recipe found, displayRecipes:', displayRecipes);
      return null;
    }

    // 更新图片获取逻辑 - 适配新的API格式
    let heroImage = null;
    if (heroRecipe.fields && heroRecipe.fields.field_media_image && heroRecipe.fields.field_media_image.image) {
      heroImage = getImageUrl(heroRecipe.fields.field_media_image.image);
    }

    // 如果没有图片，使用默认图片
    const defaultImage = '/themes/custom/react/images/hero-pasta.jpg';
    const backgroundImage = heroImage || defaultImage;

    // 修复摘要内容的处理 - 防止渲染对象
    let summaryContent = 'A wholesome pasta bake is the ultimate comfort food. This delicious bake is super quick to prepare and an ideal midweek meal for all the family.';
    if (heroRecipe.fields?.field_summary) {
      const summaryField = heroRecipe.fields.field_summary;
      if (typeof summaryField === 'string') {
        summaryContent = summaryField;
      } else if (summaryField.processed && typeof summaryField.processed === 'string') {
        summaryContent = summaryField.processed;
      } else if (summaryField.value && typeof summaryField.value === 'string') {
        summaryContent = summaryField.value;
      } else {
        console.warn('无法解析Hero摘要字段:', summaryField);
      }
    }

    return (
      <Box sx={{
        position: 'relative',
        height: '600px',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'flex-end',
        mb: 4
      }}>
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            p: 4,
            color: '#fff'
          }}
        >
          <Container maxWidth="lg">
            <Typography variant="h3" component="h1" gutterBottom sx={{
              color: '#fff',
              fontFamily: 'Georgia, serif',
              fontWeight: 'normal',
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}>
              {heroRecipe.title || 'Super easy vegetarian pasta bake'}
            </Typography>
            <Box
              sx={{
                mb: 3,
                color: '#fff',
                maxWidth: '600px',
                fontSize: { xs: '1rem', md: '1.1rem' },
                '& p': { // 添加段落样式
                  margin: 0,
                  fontSize: 'inherit'
                }
              }}
              dangerouslySetInnerHTML={{ __html: summaryContent }}
            />
            <Button
              component={Link}
              to={getRecipeUrl(heroRecipe.id)}
              variant="contained"
              sx={{
                bgcolor: '#E84E1B',
                color: '#fff',
                px: 3,
                py: 1,
                fontSize: '1rem',
                textDecoration: 'none',
                '&:hover': {
                  bgcolor: '#d14d1f',
                  textDecoration: 'none'
                }
              }}
            >
              {t('homepage.viewRecipe')}
            </Button>
          </Container>
        </Box>
      </Box>
    );
  };

  // 渲染文章预览
  const renderArticlePreview = () => {
    // 获取第一篇文章
    const article = displayArticles[0];
    if (!article) {
      console.log('No articles found, displayArticles:', displayArticles);
      return null;
    }

    // 更新图片获取逻辑 - 适配新的API格式
    let articleImage = null;
    if (article.fields && article.fields.field_media_image && article.fields.field_media_image.image) {
      articleImage = getImageUrl(article.fields.field_media_image.image);
    }

    // 默认图片
    const defaultImage = '/themes/custom/react/images/article-default.jpg';
    const displayImage = articleImage || defaultImage;

    // 修复摘要字段的处理 - 防止渲染对象
    let summaryText = 'Transform your morning routine with these delicious oatmeal recipes.';
    if (article.fields?.field_summary) {
      const summaryField = article.fields.field_summary;
      if (typeof summaryField === 'string') {
        summaryText = summaryField;
      } else if (summaryField.processed && typeof summaryField.processed === 'string') {
        // 移除HTML标签
        summaryText = summaryField.processed.replace(/<[^>]*>/g, '');
      } else if (summaryField.value && typeof summaryField.value === 'string') {
        summaryText = summaryField.value;
      } else {
        console.warn('无法解析文章摘要字段:', summaryField);
      }
    } else if (article.summary && typeof article.summary === 'string') {
      summaryText = article.summary;
    }

    return (
      <Box sx={{ mb: 6 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                {article.title || 'Give your oatmeal the ultimate makeover'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {summaryText}
              </Typography>
              <Button
                variant="text"
                sx={{
                  color: '#E84E1B',
                  pl: 0,
                  '&:hover': {
                    bgcolor: 'transparent',
                    textDecoration: 'underline'
                  }
                }}
              >
                {t('homepage.viewArticle')}
              </Button>
            </Box>
            <Box sx={{
              flex: 1,
              '& img': {
                width: '100%',
                height: 'auto',
                borderRadius: 1,
                maxHeight: '300px',
                objectFit: 'cover'
              }
            }}>
              <img src={displayImage} alt={article.title} />
            </Box>
          </Box>
        </Container>
      </Box>
    );
  };

  // 渲染食谱卡片
  const renderRecipeCards = () => {
    // 获取第2和第3个食谱
    const recipeCards = displayRecipes.slice(1, 3);

    if (recipeCards.length === 0) {
      console.log('No display recipes found, total displayRecipes:', displayRecipes.length);
      return null;
    }

    return (
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Grid container spacing={3}>
          {recipeCards.map((recipe) => {
            // 更新图片获取逻辑 - 适配新的API格式
            let recipeImage = null;
            if (recipe.fields && recipe.fields.field_media_image && recipe.fields.field_media_image.image) {
              recipeImage = getImageUrl(recipe.fields.field_media_image.image);
            }

            const defaultImage = '/themes/custom/react/images/recipe-default.jpg';
            const displayImage = recipeImage || defaultImage;

            return (
              <Grid item xs={12} sm={6} key={recipe.id}>
                <Card sx={{
                  height: '100%',
                  boxShadow: 'none',
                  '&:hover': {
                    '& .MuiCardMedia-root': {
                      transform: 'scale(1.05)',
                      transition: 'transform 0.3s ease'
                    }
                  }
                }}>
                  <Box sx={{ overflow: 'hidden' }}>
                    <CardMedia
                      component={Link}
                      to={getRecipeUrl(recipe.id)}
                      sx={{
                        display: 'block',
                        textDecoration: 'none',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <img
                        src={displayImage}
                        alt={recipe.title}
                        style={{
                          width: '100%',
                          height: '300px',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    </CardMedia>
                  </Box>
                  <CardContent sx={{ px: 0 }}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {recipe.title}
                    </Typography>
                    <Button
                      component={Link}
                      to={getRecipeUrl(recipe.id)}
                      variant="text"
                      sx={{
                        color: '#E84E1B',
                        pl: 0,
                        textDecoration: 'none',
                        '&:hover': {
                          bgcolor: 'transparent',
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {t('homepage.viewRecipe')}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    );
  };

  // 渲染Home标题区
  const renderHomeSection = () => (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography
        variant="h3"
        component="h2"
        sx={{
          fontFamily: 'Georgia, serif',
          color: '#666',
          fontWeight: 'normal',
          fontSize: { xs: '2rem', md: '2.5rem' }
        }}
      >
        Home
      </Typography>
    </Container>
  );

  // 主渲染
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {t('homepage.error')}: {error}
        </Alert>
      </Container>
    );
  }

  // 使用默认数据如果API数据为空
  const displayRecipes = recipes.length > 0 ? recipes : getDefaultRecipes();
  const displayArticles = articles.length > 0 ? articles : getDefaultArticles();
  const displayCategories = categories.length > 0 ? categories : getDefaultCategories();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navigation
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        onSearch={handleSearch}
        activeTab="home"
      />
      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            {t('homepage.loading')}
          </Typography>
        </Box>
      ) : (
        <>
          {renderHeroSection()}
          {renderArticlePreview()}
          {renderRecipeCards()}
          {renderHomeSection()}
          <RecipeCollections categories={displayCategories} />
          <Footer />
        </>
      )}
    </Box>
  );
};

export default HomePage;
