import {
    Search as SearchIcon
} from '@mui/icons-material';
import {
    AppBar,
    Box,
    Button,
    Container,
    TextField,
    Toolbar,
    Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

// 自定义搜索输入框样式
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: '#fff',
  border: '1px solid #ddd',
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  maxWidth: '500px',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#999',
}));

const StyledInputBase = styled(TextField)(({ theme }) => ({
  color: '#333',
  width: '100%',
  '& .MuiInputBase-root': {
    padding: '2px 100px 2px 0',
  },
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: '100%',
    fontSize: '0.875rem',
    '&::placeholder': {
      color: '#999',
      opacity: 1,
    },
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
}));

const Navigation = ({
  currentLanguage = 'en',
  onLanguageChange,
  onSearch,
  activeTab = 'home'
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // 语言配置
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'zh-hans', label: '简体中文' },
    { code: 'es', label: 'Español' }
  ];

  // 语言路径配置
  const languageConfig = {
    'en': { code: 'en', urlAlias: '' },
    'es': { code: 'es', urlAlias: '/es' },
    'zh-hans': { code: 'zh-hans', urlAlias: '/zh-hans' }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    // 构建搜索URL，导向到recipes页面
    const langConfig = languageConfig[currentLanguage];
    const basePath = langConfig.urlAlias || '';
    const searchUrl = `${basePath}/recipes?search=${encodeURIComponent(searchQuery.trim())}`;

    // 导航到recipes页面并传递搜索参数
    navigate(searchUrl);

    // 如果父组件提供了搜索处理函数，也调用它
    if (onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 获取导航链接URL
  const getNavUrl = (path) => {
    const langConfig = languageConfig[currentLanguage];
    const basePath = langConfig.urlAlias || '';
    return path === '/' ? (basePath || '/') : `${basePath}${path}`;
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#fff', boxShadow: 'none' }}>
      <Container>
        {/* 第一行: 语言切换、搜索框、登录按钮 */}
        <Toolbar sx={{ minHeight: '48px !important', justifyContent: 'space-between' }}>
          {/* 语言切换 */}
          <Box sx={{ display: 'flex' }}>
            {languages.map((lang) => (
              <Button
                key={lang.code}
                sx={{
                  color: '#333',
                  textTransform: 'none',
                  minWidth: 'auto',
                  px: 1,
                  fontWeight: currentLanguage === lang.code ? 'bold' : 'normal'
                }}
                onClick={() => onLanguageChange && onLanguageChange(lang.code)}
              >
                {lang.label}
              </Button>
            ))}
          </Box>

          {/* 搜索框 */}
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder={t('homepage.searchPlaceholder')}
              inputProps={{ 'aria-label': 'search' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button
              variant="text"
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666',
                textTransform: 'none'
              }}
              onClick={handleSearch}
            >
              {t('homepage.searchButton')}
            </Button>
          </Search>

          {/* 登录按钮 */}
          <Button
            sx={{
              color: '#333',
              textTransform: 'none',
              minWidth: 'auto',
              px: 2
            }}
          >
            {t('homepage.login')}
          </Button>
        </Toolbar>

        {/* 第二行: Logo和主导航 */}
        <Toolbar sx={{ justifyContent: 'space-between', borderTop: '1px solid #eee' }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="h6"
              component={Link}
              to={getNavUrl('/')}
              sx={{
                color: '#F15D22',
                fontFamily: 'Georgia, serif',
                fontSize: '2rem',
                fontWeight: 'bold',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'none'
                }
              }}
            >
              umami
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{
                color: '#333',
                marginLeft: 1,
                textTransform: 'uppercase',
                letterSpacing: 1
              }}
            >
              FOOD MAGAZINE
            </Typography>
          </Box>

          {/* 主导航 */}
          <Box sx={{ display: 'flex' }}>
            <Button
              component={Link}
              to={getNavUrl('/')}
              sx={{
                color: '#333',
                borderBottom: activeTab === 'home' ? '2px solid #F15D22' : 'none',
                borderRadius: 0,
                px: 2,
                py: 2,
                textDecoration: 'none',
                '&:hover': {
                  backgroundColor: 'transparent',
                  borderBottom: '2px solid #F15D22',
                  textDecoration: 'none'
                }
              }}
            >
              {t('homepage.home')}
            </Button>
            <Button
              component={Link}
              to={getNavUrl('/articles')}
              sx={{
                color: '#333',
                borderBottom: activeTab === 'articles' ? '2px solid #F15D22' : 'none',
                borderRadius: 0,
                px: 2,
                py: 2,
                textDecoration: 'none',
                '&:hover': {
                  backgroundColor: 'transparent',
                  borderBottom: '2px solid #F15D22',
                  textDecoration: 'none'
                }
              }}
            >
              {t('homepage.articles')}
            </Button>
            <Button
              component={Link}
              to={getNavUrl('/recipes')}
              sx={{
                color: '#333',
                borderBottom: activeTab === 'recipes' ? '2px solid #F15D22' : 'none',
                borderRadius: 0,
                px: 2,
                py: 2,
                textDecoration: 'none',
                '&:hover': {
                  backgroundColor: 'transparent',
                  borderBottom: '2px solid #F15D22',
                  textDecoration: 'none'
                }
              }}
            >
              {t('homepage.recipes')}
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation;
