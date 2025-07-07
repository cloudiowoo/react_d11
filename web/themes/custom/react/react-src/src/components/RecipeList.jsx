/*
 * @Date: 2025-01-15 14:30:00
 * @LastEditors: cloudio cloudio.woo@gmail.com
 * @LastEditTime: 2025-07-07 14:21:38
 * @FilePath: /test_d11/web/themes/custom/react/react-src/src/components/RecipeList.jsx
 */
import {
  Restaurant as DifficultyIcon,
  People as ServingsIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Link as MuiLink,
  Pagination,
  Select,
  TextField,
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

const RecipeList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // 状态管理
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 9
  });

  // 搜索和过滤状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  // 语言配置
  const languageConfig = {
    'en': { code: 'en', urlAlias: '' },
    'es': { code: 'es', urlAlias: '/es' },
    'zh-hans': { code: 'zh-hans', urlAlias: '/zh-hans' }
  };

  // 难度选项
  const difficultyOptions = [
    { value: '', label: t('recipe.allDifficulties', 'All Difficulties') },
    { value: 'easy', label: t('recipe.easy', 'Easy') },
    { value: 'medium', label: t('recipe.medium', 'Medium') },
    { value: 'hard', label: t('recipe.hard', 'Hard') }
  ];

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
    loadRecipesData();
  };

  // 加载食谱数据
  const loadRecipesData = async () => {
    try {
      setLoading(true);
      setError(null);

      const page = parseInt(searchParams.get('page')) || 1;
      const category = searchParams.get('category') || '';
      const difficulty = searchParams.get('difficulty') || '';
      const search = searchParams.get('search') || '';

      console.log('Loading recipes with params:', { page, category, difficulty, search });

      // 构建API查询参数
      const queryParams = {
        page: page - 1, // API使用0开始的页码
        limit: pagination.itemsPerPage,
        sort: 'created',
        order: 'DESC'
      };

      // 添加过滤条件
      if (category) {
        queryParams['filter[field_recipe_category.target_id]'] = category;
      }
      if (difficulty) {
        queryParams['filter[field_difficulty]'] = difficulty;
      }
      if (search) {
        queryParams['filter[title][operator]'] = 'CONTAINS';
        queryParams['filter[title][value]'] = search;
      }

      console.log('Final API query params:', queryParams);

      const [recipesData, categoriesData] = await Promise.all([
        contentApiService.getRecipes(queryParams),
        contentApiService.getRecipeCategories({ limit: 50 })
      ]);

      console.log('Recipes API response:', recipesData);
      console.log('Categories API response:', categoriesData);

      // 处理食谱数据 - 更灵活地处理不同的API响应格式
      let recipesList = [];
      let paginationInfo = {
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: pagination.itemsPerPage
      };

      if (recipesData) {
        // 处理不同的API响应格式
        if (recipesData.items && Array.isArray(recipesData.items)) {
          recipesList = recipesData.items;
          if (recipesData.pagination) {
            paginationInfo = {
              currentPage: page,
              totalPages: recipesData.pagination.totalPages || Math.ceil(recipesData.pagination.total / pagination.itemsPerPage),
              totalItems: recipesData.pagination.total || recipesList.length,
              itemsPerPage: pagination.itemsPerPage
            };
          }
        } else if (recipesData.data && Array.isArray(recipesData.data)) {
          recipesList = recipesData.data;
          if (recipesData.meta && recipesData.meta.count) {
            paginationInfo = {
              currentPage: page,
              totalPages: Math.ceil(recipesData.meta.count / pagination.itemsPerPage),
              totalItems: recipesData.meta.count,
              itemsPerPage: pagination.itemsPerPage
            };
          }
        } else if (Array.isArray(recipesData)) {
          // 如果直接返回数组
          recipesList = recipesData;
          paginationInfo = {
            currentPage: 1,
            totalPages: 1,
            totalItems: recipesList.length,
            itemsPerPage: pagination.itemsPerPage
          };
        } else {
          console.warn('Unexpected recipes API response format:', recipesData);
        }
      }

      console.log('Processed recipes list:', recipesList);
      console.log('Pagination info:', paginationInfo);

      setRecipes(recipesList);
      setPagination(paginationInfo);

      // 处理分类数据
      let categoriesList = [];
      if (categoriesData) {
        if (categoriesData.items && Array.isArray(categoriesData.items)) {
          categoriesList = categoriesData.items;
        } else if (categoriesData.data && Array.isArray(categoriesData.data)) {
          categoriesList = categoriesData.data;
        } else if (Array.isArray(categoriesData)) {
          categoriesList = categoriesData;
        }
      }

      console.log('Processed categories list:', categoriesList);
      setCategories(categoriesList);

      // 更新搜索和过滤状态
      setSearchQuery(search);
      setSelectedCategory(category);
      setSelectedDifficulty(difficulty);

    } catch (err) {
      console.error('加载食谱数据失败:', err);
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
    loadRecipesData();
  }, [searchParams]);

  // 搜索处理
  const handleSearch = (query) => {
    const newParams = new URLSearchParams(searchParams);
    if (query) {
      newParams.set('search', query);
    } else {
      newParams.delete('search');
    }
    newParams.delete('page'); // 重置到第一页
    setSearchParams(newParams);
  };

  // 分类过滤处理
  const handleCategoryChange = (categoryId) => {
    const newParams = new URLSearchParams(searchParams);
    if (categoryId) {
      newParams.set('category', categoryId);
    } else {
      newParams.delete('category');
    }
    newParams.delete('page'); // 重置到第一页
    setSearchParams(newParams);
  };

  // 难度过滤处理
  const handleDifficultyChange = (difficulty) => {
    const newParams = new URLSearchParams(searchParams);
    if (difficulty) {
      newParams.set('difficulty', difficulty);
    } else {
      newParams.delete('difficulty');
    }
    newParams.delete('page'); // 重置到第一页
    setSearchParams(newParams);
  };

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

  // 生成食谱链接URL
  const getRecipeUrl = (recipe) => {
    const langConfig = languageConfig[currentLanguage];
    const basePath = langConfig.urlAlias || '';

    // 如果食谱有URL字段，提取URL别名
    if (recipe && typeof recipe === 'object' && recipe.url) {
      const urlPath = new URL(recipe.url).pathname;
      // 提取 /recipes/xxx 中的 xxx 部分
      const match = urlPath.match(/\/recipes\/(.+)$/);
      if (match) {
        return `${basePath}/recipes/${match[1]}`;
      }
    }

    // 否则使用ID
    const recipeId = typeof recipe === 'object' ? recipe.id : recipe;
    return `${basePath}/recipes/${recipeId}`;
  };

  // 格式化时间
  const formatTime = (minutes) => {
    if (!minutes) return '';
    if (minutes < 60) {
      return `${minutes} ${t('recipe.minutes', 'min')}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} ${t('recipe.hours', 'h')}`;
    }
    return `${hours} ${t('recipe.hours', 'h')} ${remainingMinutes} ${t('recipe.minutes', 'min')}`;
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
            {t('navigation.recipes', 'Recipes')}
          </Typography>
        </Box>
      </Container>
    </Box>
  );

  // 渲染Hero区域
  const renderHero = () => (
    <Box sx={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: { xs: 6, md: 8 },
      mb: 4
    }}>
      <Container maxWidth="lg">
        <Box sx={{
          textAlign: 'center',
          maxWidth: '800px',
          mx: 'auto'
        }}>
          {/* Hero标题 */}
          <Typography variant="h1" component="h1" sx={{
            fontFamily: 'Georgia, serif',
            fontWeight: 'normal',
            color: '#333',
            fontSize: { xs: '2.5rem', md: '4rem' },
            lineHeight: 1.2,
            mb: 3
          }}>
            {t('recipes.title', 'Recipes')}
          </Typography>

          {/* Hero副标题 */}
          <Typography variant="h5" component="p" sx={{
            color: '#666',
            fontSize: { xs: '1.1rem', md: '1.3rem' },
            lineHeight: 1.5,
            mb: 4,
            maxWidth: '600px',
            mx: 'auto'
          }}>
            {t('recipes.heroSubtitle', 'Discover delicious recipes from around the world. From quick weeknight dinners to impressive weekend feasts.')}
          </Typography>

          {/* Hero搜索框 */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            maxWidth: '500px',
            mx: 'auto'
          }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={t('recipes.searchPlaceholder', 'Search recipes...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchQuery);
                }
              }}
              sx={{
                bgcolor: 'white',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <Button
              variant="contained"
              onClick={() => handleSearch(searchQuery)}
              sx={{
                bgcolor: '#E84E1B',
                '&:hover': { bgcolor: '#d63916' },
                borderRadius: 2,
                px: 4,
                py: 1.5,
                minWidth: { xs: 'auto', sm: '120px' },
                textTransform: 'uppercase',
                fontWeight: 'bold'
              }}
            >
              {t('recipes.search', 'Search')}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );

  // 渲染页面标题和搜索过滤区域
  const renderHeader = () => (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 过滤区域 */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
        mb: 4,
        alignItems: { xs: 'stretch', md: 'center' }
      }}>
        {/* 分类过滤 */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>{t('recipes.category', 'Category')}</InputLabel>
          <Select
            value={selectedCategory}
            label={t('recipes.category', 'Category')}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <MenuItem value="">
              {t('recipes.allCategories', 'All Categories')}
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name || category.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 难度过滤 */}
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>{t('recipes.difficulty', 'Difficulty')}</InputLabel>
          <Select
            value={selectedDifficulty}
            label={t('recipes.difficulty', 'Difficulty')}
            onChange={(e) => handleDifficultyChange(e.target.value)}
          >
            {difficultyOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        {/* 结果统计 */}
        <Typography variant="body2" sx={{ color: '#666' }}>
          {t('recipes.resultsCount', 'Found {{count}} recipes', { count: pagination.totalItems })}
        </Typography>
      </Box>
    </Container>
  );

  // 渲染食谱卡片
  const renderRecipeCard = (recipe) => {
    const recipeImage = getImageUrl(recipe.fields?.field_recipe_image?.image || recipe.fields?.field_media_image?.image);
    const prepTime = recipe.fields?.field_prep_time?.value || 0;
    const cookTime = recipe.fields?.field_cook_time?.value || 0;
    const totalTime = prepTime + cookTime;
    const servings = recipe.fields?.field_servings?.value || 4;
    const difficulty = recipe.fields?.field_difficulty?.value || 'Easy';

    return (
      <Box
        key={recipe.id}
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
        {/* 食谱图片 */}
        {recipeImage && (
          <Box sx={{ position: 'relative', paddingTop: '60%', overflow: 'hidden' }}>
            <img
              src={recipeImage}
              alt={recipe.title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            {/* 难度标签 */}
            <Chip
              label={t(`recipe.${difficulty.toLowerCase()}`, difficulty)}
              size="small"
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                bgcolor: 'rgba(255,255,255,0.9)',
                color: '#333',
                fontWeight: 'bold'
              }}
            />
          </Box>
        )}

        {/* 食谱信息 */}
        <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* 标题 */}
          <Typography variant="h6" component="h3" sx={{
            fontFamily: 'Georgia, serif',
            fontWeight: 'normal',
            fontSize: '1.25rem',
            lineHeight: 1.3,
            mb: 2,
            color: '#333',
            flex: 1
          }}>
            <Link
              to={getRecipeUrl(recipe)}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                '&:hover': { color: '#E84E1B' }
              }}
            >
              {recipe.title}
            </Link>
          </Typography>

          {/* 食谱元信息 */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            pt: 2,
            borderTop: '1px solid #eee'
          }}>
            {/* 时间 */}
            {totalTime > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimeIcon sx={{ fontSize: 16, color: '#666' }} />
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {formatTime(totalTime)}
                </Typography>
              </Box>
            )}

            {/* 份数 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ServingsIcon sx={{ fontSize: 16, color: '#666' }} />
              <Typography variant="body2" sx={{ color: '#666' }}>
                {servings}
              </Typography>
            </Box>

            {/* 难度 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <DifficultyIcon sx={{ fontSize: 16, color: '#666' }} />
              <Typography variant="body2" sx={{ color: '#666' }}>
                {t(`recipe.${difficulty.toLowerCase()}`, difficulty)}
              </Typography>
            </Box>
          </Box>

          {/* 查看食谱按钮 */}
          <Button
            component={Link}
            to={getRecipeUrl(recipe)}
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
            {t('recipe.viewRecipe', 'VIEW RECIPE')} ›
          </Button>
        </Box>
      </Box>
    );
  };

  // 渲染食谱网格
  const renderRecipesGrid = () => (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
      {recipes.length > 0 ? (
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          justifyContent: { xs: 'center', md: 'flex-start' }
        }}>
          {recipes.map((recipe) => (
            <Box
              key={recipe.id}
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
              {renderRecipeCard(recipe)}
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
            {t('recipes.noResults', 'No recipes found')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#999' }}>
            {t('recipes.tryDifferentFilters', 'Try adjusting your search or filters')}
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
          onSearch={handleSearch}
          activeTab="recipes"
        />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {t('recipes.loadError', 'Failed to load recipes')}: {error}
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
        activeTab="recipes"
      />

      {renderBreadcrumb()}
      {renderHero()}
      {renderHeader()}

      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            {t('common.loading', '加载中...')}
          </Typography>
        </Box>
      ) : (
        <>
          {renderRecipesGrid()}
          {renderPagination()}
        </>
      )}

      <Footer />
    </Box>
  );
};

export default RecipeList;
