/*
 * @Date: 2025-07-07 11:44:34
 * @LastEditors: cloudio cloudio.woo@gmail.com
 * @LastEditTime: 2025-07-07 12:46:19
 * @FilePath: /test_d11/web/themes/custom/react/react-src/src/components/RecipeDetail.jsx
 */
import {
  Speed as DifficultyIcon,
  Restaurant as ServingIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
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
import RecipeCollections from './RecipeCollections';

const RecipeDetail = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t, i18n } = useTranslation();
  const { recipeId, urlAlias } = useParams();

  // 状态管理
  const [recipe, setRecipe] = useState(null);
  const [relatedRecipes, setRelatedRecipes] = useState([]);
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
    loadRecipeData();
  };

  // 加载食谱数据
  const loadRecipeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 检测recipeId是数字还是URL别名
      const isNumericId = /^\d+$/.test(recipeId);

      // 如果recipeId不是数字，那么它就是URL别名
      const actualUrlAlias = isNumericId ? urlAlias : recipeId;

      console.log('Loading recipe data:', { recipeId, urlAlias, isNumericId, actualUrlAlias });

      const [recipeData, categoriesData] = await Promise.all([
        isNumericId
          ? contentApiService.getRecipe(recipeId)
          : contentApiService.getRecipeByUrlAlias(actualUrlAlias),
        contentApiService.getRecipeCategories({ limit: 20 })
      ]);

      console.log('Recipe data:', recipeData);
      setRecipe(recipeData);
      setCategories(categoriesData.data || categoriesData.items || []);

      // 加载相关食谱
      if (recipeData?.fields?.field_recipe_category) {
        // 修复：直接从field_recipe_category获取ID
        const categoryId = recipeData.fields.field_recipe_category.id || recipeData.fields.field_recipe_category.target_id;
        console.log('Category ID for related recipes:', categoryId);

        if (categoryId) {
          try {
            const relatedData = await contentApiService.getRecipesByCategory(categoryId, recipeData.id, 4);
            console.log('Related recipes data:', relatedData);
            setRelatedRecipes(relatedData || []);
          } catch (relatedError) {
            console.error('加载相关食谱失败:', relatedError);
            // 继续执行，不影响主要功能
          }
        }
      }

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
    loadRecipeData();
  }, [recipeId]);

  // 搜索处理
  const handleSearch = (query) => {
    console.log('搜索:', query);
    // 实现搜索逻辑
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
    const categoryEntity = recipe?.included?.find(item => item.id === categoryId);
    return categoryEntity?.attributes?.name || null;
  };

  // 生成食谱链接URL
  const getRecipeUrl = (recipeData) => {
    const langConfig = languageConfig[currentLanguage];
    const basePath = langConfig.urlAlias || '';

    // 如果传入的是食谱对象且有URL字段，提取URL别名
    if (recipeData && typeof recipeData === 'object' && recipeData.url) {
      const urlPath = new URL(recipeData.url).pathname;
      // 提取 /recipes/xxx 中的 xxx 部分
      const match = urlPath.match(/\/recipes\/(.+)$/);
      if (match) {
        return `${basePath}/recipes/${match[1]}`;
      }
    }

    // 否则使用ID（如果传入的是数字或字符串ID）
    const recipeId = typeof recipeData === 'object' ? recipeData.id : recipeData;
    return `${basePath}/recipes/${recipeId}`;
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
            to={`${languageConfig[currentLanguage].urlAlias || ''}/recipes`}
            sx={{ color: '#666', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Recipes
          </MuiLink>
          <Typography sx={{ color: '#999' }}>›</Typography>
          <Typography sx={{ color: '#333' }}>
            {recipe?.title || 'Recipe'}
          </Typography>
        </Box>
      </Container>
    </Box>
  );

  // 渲染食谱头部信息
  const renderRecipeHeader = () => {
    if (!recipe) return null;

    const categoryName = getCategoryName(recipe.fields?.field_recipe_category);
    const recipeImage = getImageUrl(recipe.fields?.field_media_image?.image);
    const tags = recipe.fields?.field_tags?.data || [];

    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* 标题和描述部分 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{
            fontFamily: 'Georgia, serif',
            fontWeight: 'normal',
            color: '#333',
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}>
            {recipe.title}
          </Typography>

          {/* 分类和标签 */}
          <Box sx={{ mb: 3 }}>
            {categoryName && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" component="span" sx={{ color: '#666', mr: 1 }}>
                  {t('recipe.category', 'Recipe category')}:
                </Typography>
                <MuiLink href="#" sx={{ color: '#0066cc', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  {categoryName}
                </MuiLink>
              </Box>
            )}

            {tags.length > 0 && (
              <Box>
                <Typography variant="body2" component="span" sx={{ color: '#666', mr: 1 }}>
                  {t('recipe.tags', 'Tags')}:
                </Typography>
                {tags.map((tag, index) => (
                  <React.Fragment key={tag.id}>
                    <MuiLink href="#" sx={{ color: '#0066cc', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                      {tag.attributes?.name || 'Tag'}
                    </MuiLink>
                    {index < tags.length - 1 && <Typography component="span" sx={{ color: '#999', mx: 0.5 }}>,</Typography>}
                  </React.Fragment>
                ))}
              </Box>
            )}
          </Box>

          {/* 描述 */}
          <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.6, color: '#333' }}>
            <div dangerouslySetInnerHTML={{
              __html: recipe.fields?.field_summary?.processed ||
                     recipe.fields?.field_summary?.value ||
                     recipe.fields?.field_summary ||
                     ''
            }} />
          </Typography>
        </Box>

        {/* 图片和属性信息左右布局 */}
        <Grid container spacing={4}>
          {/* 左侧：食谱图片 */}
          <Grid item xs={12} md={8}>
            {recipeImage && (
              <Box sx={{ mb: 4 }}>
                <img
                  src={recipeImage}
                  alt={recipe.title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '500px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              </Box>
            )}
          </Grid>

          {/* 右侧：属性信息 */}
          <Grid item xs={12} md={4}>
            <Box sx={{
              position: 'sticky',
              top: 20,
              bgcolor: '#f9f9f9',
              p: 3,
              borderRadius: 2,
              border: '1px solid #eee'
            }}>
              {/* 准备时间 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E84E1B',
                  border: '2px solid #E84E1B'
                }}>
                  <TimeIcon />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                    {t('recipe.preparationTime', 'Preparation time')}:
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#333', fontWeight: 'bold' }}>
                    <div dangerouslySetInnerHTML={{
                      __html: recipe.fields?.field_preparation_time?.processed ||
                             recipe.fields?.field_preparation_time?.value ||
                             recipe.fields?.field_preparation_time ||
                             '30 minutes'
                    }} />
                  </Typography>
                </Box>
              </Box>

              {/* 烹饪时间 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E84E1B',
                  border: '2px solid #E84E1B'
                }}>
                  <TimeIcon />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                    {t('recipe.cookingTime', 'Cooking time')}:
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#333', fontWeight: 'bold' }}>
                    <div dangerouslySetInnerHTML={{
                      __html: recipe.fields?.field_cooking_time?.processed ||
                             recipe.fields?.field_cooking_time?.value ||
                             recipe.fields?.field_cooking_time ||
                             '60 minutes'
                    }} />
                  </Typography>
                </Box>
              </Box>

              {/* 份数 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E84E1B',
                  border: '2px solid #E84E1B'
                }}>
                  <ServingIcon />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                    {t('recipe.servings', 'Number of servings')}:
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#333', fontWeight: 'bold' }}>
                    <div dangerouslySetInnerHTML={{
                      __html: recipe.fields?.field_number_of_servings?.processed ||
                             recipe.fields?.field_number_of_servings?.value ||
                             recipe.fields?.field_number_of_servings ||
                             '4'
                    }} />
                  </Typography>
                </Box>
              </Box>

              {/* 难度 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E84E1B',
                  border: '2px solid #E84E1B'
                }}>
                  <DifficultyIcon />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                    {t('recipe.difficulty', 'Difficulty')}:
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#333', fontWeight: 'bold' }}>
                    <div dangerouslySetInnerHTML={{
                      __html: recipe.fields?.field_difficulty?.processed ||
                             recipe.fields?.field_difficulty?.value ||
                             recipe.fields?.field_difficulty ||
                             'Medium'
                    }} />
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    );
  };

  // 渲染食材
  const renderIngredients = () => {
    // 修复：直接从 recipe.fields.field_ingredients 获取数组
    const ingredients = recipe?.fields?.field_ingredients;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return (
        <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
          {t('recipe.noIngredients', '暂无食材信息')}
        </Typography>
      );
    }

    return (
      <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {ingredients.map((ingredient, index) => (
          <Box
            component="li"
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              mb: 1.5,
              '&:before': {
                content: '""',
                width: 8,
                height: 8,
                backgroundColor: '#f59e0b',
                borderRadius: '50%',
                mt: 1,
                mr: 2,
                flexShrink: 0
              }
            }}
          >
            <Typography variant="body2" sx={{ color: '#333' }}>
              {ingredient.trim()}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  // 渲染配料和制作步骤
  const renderRecipeContent = () => {
    if (!recipe) return null;

    const instructions = recipe.fields?.field_recipe_instruction?.processed ||
                        recipe.fields?.field_recipe_instruction?.value ||
                        recipe.fields?.field_instructions?.processed ||
                        recipe.fields?.field_instructions?.value || '';

    return (
      <Container maxWidth="lg">
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 4, md: 6 },
          py: 4
        }}>
          {/* 配料 */}
          <Box sx={{
            flex: { md: '0 0 40%' },
            width: '100%'
          }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{
              fontFamily: 'Georgia, serif',
              fontWeight: 'normal',
              color: '#333',
              mb: 3
            }}>
              {t('recipe.ingredients', 'Ingredients')}
            </Typography>

            <Box sx={{
              bgcolor: '#f9f9f9',
              p: 3,
              borderRadius: 2,
              border: '1px solid #eee',
              '& ul': {
                pl: 2,
                listStyle: 'disc',
                '& li': {
                  mb: 1,
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  color: '#333'
                }
              }
            }}>
              {renderIngredients()}
            </Box>
          </Box>

          {/* 制作步骤 */}
          <Box sx={{
            flex: { md: '0 0 60%' },
            width: '100%'
          }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{
              fontFamily: 'Georgia, serif',
              fontWeight: 'normal',
              color: '#333',
              mb: 3
            }}>
              {t('recipe.directions', 'Directions')}
            </Typography>

            <Box sx={{
              '& ol': {
                pl: 0,
                listStyle: 'none',
                counterReset: 'step-counter',
                '& li': {
                  mb: 3,
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  color: '#333',
                  position: 'relative',
                  pl: 4,
                  counterIncrement: 'step-counter',
                  '&::before': {
                    content: 'counter(step-counter)',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#E84E1B',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }
                }
              }
            }}>
              {instructions ? (
                <div dangerouslySetInnerHTML={{ __html: instructions }} />
              ) : (
                <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                  {t('recipe.noInstructions', 'No instructions information available')}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Container>
    );
  };

  // 渲染相关食谱
  const renderRelatedRecipes = () => {
    if (relatedRecipes.length === 0) return null;

    return (
      <Box sx={{ py: 6, bgcolor: '#f8f8f8' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" gutterBottom sx={{
            fontFamily: 'Georgia, serif',
            fontWeight: 'normal',
            color: '#333',
            mb: 4,
            textAlign: 'center'
          }}>
            {t('recipe.relatedRecipes', 'Related recipes')}
          </Typography>

          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            justifyContent: 'space-between'
          }}>
            {relatedRecipes.map((relatedRecipe) => {
              const recipeImage = getImageUrl(relatedRecipe.fields?.field_media_image?.image);

              // 修复难度字段的处理 - 防止渲染对象
              let difficulty = 'Medium';
              if (relatedRecipe.fields?.field_difficulty) {
                const difficultyField = relatedRecipe.fields.field_difficulty;
                if (typeof difficultyField === 'string') {
                  difficulty = difficultyField;
                } else if (difficultyField.value && typeof difficultyField.value === 'string') {
                  difficulty = difficultyField.value;
                } else if (difficultyField.processed && typeof difficultyField.processed === 'string') {
                  difficulty = difficultyField.processed.replace(/<[^>]*>/g, '');
                } else {
                  console.warn('无法解析难度字段:', difficultyField);
                }
              }

              return (
                <Box
                  key={relatedRecipe.id}
                  sx={{
                    flex: {
                      xs: '0 0 100%',
                      sm: '0 0 calc(50% - 12px)',
                      md: '0 0 calc(25% - 18px)'
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: '#fff',
                    border: '1px solid #eee',
                    borderRadius: 1,
                    overflow: 'hidden',
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': {
                      boxShadow: 2
                    }
                  }}
                >
                  {recipeImage && (
                    <Box
                      component="img"
                      src={recipeImage}
                      alt={relatedRecipe.title}
                      sx={{
                        width: '100%',
                        height: 160,
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" component="h3" sx={{
                      fontSize: '1rem',
                      fontWeight: 'normal',
                      lineHeight: 1.3,
                      mb: 1,
                      flex: 1
                    }}>
                      {relatedRecipe.title}
                    </Typography>

                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 'auto'
                    }}>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {difficulty}
                      </Typography>
                      <Button
                        component={Link}
                        to={getRecipeUrl(relatedRecipe)}
                        variant="text"
                        size="small"
                        sx={{
                          color: '#0066cc',
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
                        {t('recipe.viewRecipe', 'VIEW RECIPE')} ›
                      </Button>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Container>
      </Box>
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
          activeTab="recipes"
        />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            加载食谱失败: {error}
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

      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            加载中...
          </Typography>
        </Box>
      ) : (
        <>
          {renderRecipeHeader()}
          {renderRecipeContent()}
          {renderRelatedRecipes()}
          <RecipeCollections categories={categories} />
          <Footer />
        </>
      )}
    </Box>
  );
};

export default RecipeDetail;
