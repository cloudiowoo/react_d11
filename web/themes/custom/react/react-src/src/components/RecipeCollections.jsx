import {
    Box,
    Button,
    Container,
    Grid,
    Typography
} from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

const RecipeCollections = ({ categories = [] }) => {
  const { t } = useTranslation();

  // 默认分类数据
  const getDefaultCategories = () => [
    { id: 'cat-1', label: 'Alcohol free' },
    { id: 'cat-2', label: 'Cake' },
    { id: 'cat-3', label: 'Dairy-free' },
    { id: 'cat-4', label: 'Feel' }
  ];

  const displayCategories = categories.length > 0 ? categories : getDefaultCategories();

  // 分类项目数据
  const categoryItems = [
    ['Alcohol free', 'Based', 'Baking', 'Breakfast'],
    ['Cake', 'Carves', 'Chocolate', 'Cocktail party'],
    ['Dairy-free', 'Dessert', 'Dinner party', 'Drinks'],
    ['Feel', 'Grow your own', 'Healthy', 'Herbs']
  ];

  return (
    <Box sx={{ bgcolor: 'rgb(117,118,116)', color: '#fff', py: 6 }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{
            fontFamily: 'Georgia, serif',
            fontWeight: 'normal',
            color: '#fff',
            mb: 4,
            textAlign: 'center'
          }}
        >
          {t('homepage.recipeCollections')}
        </Typography>

        <Grid container spacing={4}>
          {displayCategories.slice(0, 4).map((category, index) => {
            const categoryName = category.label;

            return (
              <Grid item xs={12} sm={6} md={3} key={category.id}>
                <Box>
                  <Typography
                    variant="h6"
                    component="h3"
                    gutterBottom
                    sx={{
                      color: '#fff',
                      fontWeight: 'bold',
                      mb: 2
                    }}
                  >
                    {categoryName}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {categoryItems[index]?.map((item, itemIndex) => (
                      <Button
                        key={itemIndex}
                        variant="text"
                        sx={{
                          color: '#ccc',
                          justifyContent: 'flex-start',
                          textTransform: 'none',
                          p: 0,
                          minHeight: 'auto',
                          '&:hover': {
                            color: '#fff',
                            bgcolor: 'transparent'
                          }
                        }}
                      >
                        {item}
                      </Button>
                    ))}
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
};

export default RecipeCollections;
