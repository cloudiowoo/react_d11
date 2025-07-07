import {
    Box,
    Button,
    Container,
    Grid,
    Typography
} from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ bgcolor: 'rgb(97,99,93)', color: '#fff', py: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 80,
                height: 80,
                bgcolor: '#E84E1B',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold'
              }}>
                #1
              </Box>
              <Box>
                <Typography variant="h6" component="h3" gutterBottom sx={{ color: '#fff' }}>
                  {t('homepage.umamiMagazine')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                  {t('homepage.magazineDesc')}
                </Typography>
                <Button
                  variant="text"
                  sx={{
                    color: '#E84E1B',
                    textTransform: 'none',
                    p: 0,
                    '&:hover': {
                      bgcolor: 'transparent',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {t('homepage.findOutMore')}
                </Button>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="h6" component="h3" gutterBottom sx={{ color: '#fff' }}>
                {t('homepage.tellUsThink')}
              </Typography>
              <Button
                variant="text"
                sx={{
                  color: '#E84E1B',
                  textTransform: 'none',
                  p: 0,
                  '&:hover': {
                    bgcolor: 'transparent',
                    textDecoration: 'underline'
                  }
                }}
              >
                {t('homepage.contact')}
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #888' }}>
          <Typography variant="body2" sx={{ color: '#ccc' }}>
            {t('homepage.copyright')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mt: 1 }}>
            {t('homepage.terms')}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
