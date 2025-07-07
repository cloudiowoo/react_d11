import { createTheme } from '@mui/material/styles';

// 品牌色彩配置 -
const reactTheme = createTheme({
  palette: {
    mode: 'dark', // 启用深色模式
    primary: {
      main: 'rgb(202, 58, 69)', // 品牌红色
      light: '#ff5983',
      dark: '#b0003a',
      darker: 'rgb(34, 35, 35)', // 深灰色，用于导航栏背景
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff6b35', // 橙红色渐变辅助色
      light: '#ff9a66',
      dark: '#c73e1d',
      contrastText: '#ffffff',
    },
    background: {
      // default: 'rgb(34, 35, 35)', // 深黑色背景
      default: '#000000', // 卡片/面板背景
      black: '#000000', // 卡片/面板背景
    },
    surface: {
      main: '#2a2a2a', // 表面色
      light: '#3a3a3a',
      dark: '#1a1a1a',
    },
    text: {
      primary: '#ffffff', // 主要文字为白色
      secondary: '#b0b0b0', // 次要文字为浅灰色
      disabled: '#666666',
    },
    divider: '#333333', // 分割线颜色
    success: {
      main: '#00d4aa', // 青绿色成功状态
      light: '#4dffda',
      dark: '#00a085',
    },
    warning: {
      main: '#ffb74d', // 橙色警告
      light: '#ffd54f',
      dark: '#ff8a65',
    },
    error: {
      main: '#ff5252', // 红色错误状态
      light: '#ff867c',
      dark: '#c62828',
    },
    info: {
      main: '#29b6f6', // 蓝色信息
      light: '#73e8ff',
      dark: '#0086c3',
    },
    // 自定义渐变色
    gradient: {
      primary: 'linear-gradient(135deg, rgb(202, 58, 69) 0%, #ff6b35 100%)', // 主渐变
      secondary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // 辅助渐变
      accent: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // 强调渐变
      hero: 'radial-gradient(circle at 74.11507924397786% 94.03727213541667%, #222323 0%, 17.5%, rgba(34, 35, 35, 0) 35%), radial-gradient(circle at 58.97912343343099% 66.87540690104167%, rgba(22, 87, 217, 0.61) 0%, 14.7%, rgba(22, 87, 217, 0) 30%), radial-gradient(circle at 0.5939420064290365% 57.086690266927086%, rgba(22, 87, 217, 0.38) 0%, 7.9799999999999995%, rgba(22, 87, 217, 0) 14%), radial-gradient(circle at 13.200607299804688% 9.217885335286459%, rgba(202, 58, 69, 0.24) 0%, 16.5%, rgba(202, 58, 69, 0) 55%), radial-gradient(circle at 100% 37.314453125%, rgba(22, 87, 217, 0.51) 0%, 9.36%, rgba(22, 87, 217, 0) 18%), radial-gradient(circle at 78.61783345540364% 57.83340454101562%, rgba(202, 58, 69, 0.65) 0%, 17.5%, rgba(202, 58, 69, 0) 35%), radial-gradient(circle at 1.8846766153971355% 94.78581746419272%, #222323 0%, 8.6%, rgba(34, 35, 35, 0) 20%), radial-gradient(circle at 48.9013671875% 49.521484375%, #000000 0%, 100%, rgba(0, 0, 0, 0) 100%);', // 强调渐变
      hv3pro: 'radial-gradient(circle at 55.560302734375% 27.30517069498698%, rgba(202, 58, 69, 0.76) 0%, 18%, rgba(202, 58, 69, 0) 36%), radial-gradient(circle at 81.1777432759603% 85.32986323038737%, rgba(22, 87, 217, 0.47) 0%, 7.5%, rgba(22, 87, 217, 0) 15%), radial-gradient(circle at 24.078898429870605% 50.76196352640788%, #000000 0%, 35%, rgba(0, 0, 0, 0) 50%), radial-gradient(circle at 48.9013671875% 49.521484375%, rgba(0, 0, 0, 0) 0%, 100%, rgba(0, 0, 0, 0) 100%);', // 强调渐变
      footer: 'linear-gradient(0deg, rgba(202, 58, 69, 0.5) 0%, #222323 45.46630382537842%, #222323 96.09375%)', // 强调渐变
    },
  },
  typography: {
    fontFamily: [
      'Questrial',
      'Poppins',
      '"Helvetica Neue"',
      'Helvetica',
      'Arial',
      '"PingFang SC"',
      '"Hiragino Sans GB"',
      '"Microsoft YaHei"',
      '"WenQuanYi Micro Hei"',
      'sans-serif'
    ].join(','),
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      color: '#ffffff',
      fontFamily: 'Questrial, "Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      color: '#ffffff',
      fontFamily: 'Questrial, "Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#ffffff',
      fontFamily: 'Questrial, "Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    h4: {
      fontSize: '1.75rem',
      fontWeight: 500,
      lineHeight: 1.4,
      color: '#ffffff',
      fontFamily: 'Questrial, "Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.4,
      color: '#ffffff',
      fontFamily: 'Questrial, "Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
      color: '#ffffff',
      fontFamily: 'Questrial, "Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#b0b0b0',
      fontFamily: 'Questrial, Poppins, "Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#b0b0b0',
      fontFamily: 'Questrial, Poppins, "Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.02em',
      fontFamily: 'Poppins, "Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    caption: {
      fontSize: '0.75rem',
      color: '#666666',
      fontFamily: 'Questrial, Poppins, "Helvetica Neue", Helvetica, Arial, sans-serif',
    },
  },
  shape: {
    borderRadius: 12, // 更大的圆角，符合现代设计
  },
  spacing: 8,
  shadows: [
    'none',
    '0px 2px 4px rgba(229, 0, 68, 0.1)',
    '0px 4px 8px rgba(229, 0, 68, 0.15)',
    '0px 8px 16px rgba(229, 0, 68, 0.2)',
    '0px 12px 24px rgba(229, 0, 68, 0.25)',
    '0px 16px 32px rgba(229, 0, 68, 0.3)',
    '0px 20px 40px rgba(229, 0, 68, 0.35)',
    '0px 24px 48px rgba(229, 0, 68, 0.4)',
    '0px 32px 64px rgba(0, 0, 0, 0.2)',
    '0px 40px 80px rgba(0, 0, 0, 0.25)',
    '0px 48px 96px rgba(0, 0, 0, 0.3)',
    '0px 56px 112px rgba(0, 0, 0, 0.35)',
    '0px 64px 128px rgba(0, 0, 0, 0.4)',
    '0px 72px 144px rgba(0, 0, 0, 0.45)',
    '0px 80px 160px rgba(0, 0, 0, 0.5)',
    '0px 88px 176px rgba(0, 0, 0, 0.55)',
    '0px 96px 192px rgba(0, 0, 0, 0.6)',
    '0px 104px 208px rgba(0, 0, 0, 0.65)',
    '0px 112px 224px rgba(0, 0, 0, 0.7)',
    '0px 120px 240px rgba(0, 0, 0, 0.75)',
    '0px 128px 256px rgba(0, 0, 0, 0.8)',
    '0px 136px 272px rgba(0, 0, 0, 0.85)',
    '0px 144px 288px rgba(0, 0, 0, 0.9)',
    '0px 152px 304px rgba(0, 0, 0, 0.95)',
    '0px 160px 320px rgba(0, 0, 0, 1)',
  ],
  components: {
    // AppBar 样式
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(229, 0, 68, 0.2)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          // 自定义高度配置
          height: '94px', // 默认高度 80px
          '&.MuiAppBar-positionFixed': {
            height: '94px',
          },
          // 响应式高度设置
          '@media (max-width: 768px)': {
            height: '70px', // 移动端稍微降低高度
          },
        },
      },
    },
    // 按钮样式
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          padding: '6px 24px',
          fontSize: '0.95rem',
          fontWeight: 'normal',
          textTransform: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            transition: 'left 0.5s ease',
          },
          '&:hover::before': {
            left: '100%',
          },
        },
        contained: {
          backgroundColor: 'rgba(202,58,69,1)',
          boxShadow: '0 4px 20px rgba(229, 0, 68, 0.3)',
          color: '#ffffff',
          border: 'solid 1px rgba(179,179,179,0)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,1)',
            color: 'black',
            boxShadow: '0 8px 30px rgba(229, 0, 68, 0.5)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: '0 2px 10px rgba(229, 0, 68, 0.4)',
          },
          '&:disabled': {
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.3)',
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: 'rgb(202, 58, 69)',
          color: 'rgb(202, 58, 69)',
          borderWidth: '2px',
          backgroundColor: 'transparent',
          '&:hover': {
            borderColor: '#ff6b35',
            backgroundColor: 'rgba(229, 0, 68, 0.1)',
            borderWidth: '2px',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 15px rgba(229, 0, 68, 0.2)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        text: {
          color: '#b0b0b0',
          '&:hover': {
            backgroundColor: 'rgba(229, 0, 68, 0.1)',
            color: '#ffffff',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        // 尺寸变体
        sizeSmall: {
          padding: '8px 20px',
          fontSize: '0.85rem',
        },
        sizeLarge: {
          padding: '12px 32px',
          fontSize: '1.1rem',
          fontWeight: 'normal',
        },
        // 颜色变体
        containedSuccess: {
          background: 'linear-gradient(135deg, #00d4aa 0%, #00a085 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #00a085 0%, #007a65 100%)',
            boxShadow: '0 8px 30px rgba(0, 212, 170, 0.4)',
            transform: 'translateY(-2px)',
          },
        },
        containedWarning: {
          background: 'linear-gradient(135deg, #ffb74d 0%, #ff8a65 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #ff8a65 0%, #ff7043 100%)',
            boxShadow: '0 8px 30px rgba(255, 183, 77, 0.4)',
            transform: 'translateY(-2px)',
          },
        },
        containedError: {
          background: 'linear-gradient(135deg, #ff5252 0%, #c62828 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)',
            boxShadow: '0 8px 30px rgba(255, 82, 82, 0.4)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    // 卡片样式
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          borderRadius: 16,
          border: '1px solid rgba(229, 0, 68, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: 'rgba(229, 0, 68, 0.3)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    // 标签样式
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontSize: '0.8rem',
          fontWeight: 500,
          backgroundColor: 'rgba(229, 0, 68, 0.1)',
          color: '#ff6b35',
          border: '1px solid rgba(229, 0, 68, 0.2)',
          '&:hover': {
            backgroundColor: 'rgba(229, 0, 68, 0.2)',
          },
        },
        filled: {
          backgroundColor: 'rgba(229, 0, 68, 0.2)',
          color: '#ffffff',
        },
      },
    },
    // 输入框样式
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: 'rgba(26, 26, 26, 0.8)',
            '& fieldset': {
              borderColor: 'rgba(229, 0, 68, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(229, 0, 68, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#rgb(202, 58, 69)',
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#b0b0b0',
            '&.Mui-focused': {
              color: 'rgb(202, 58, 69)',
            },
          },
          '& .MuiOutlinedInput-input': {
            color: '#ffffff',
          },
        },
      },
    },
    // 浮动操作按钮
    MuiFab: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, rgb(202, 58, 69) 0%, #ff6b35 100%)',
          boxShadow: '0 8px 24px rgba(229, 0, 68, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, rgb(202, 58, 69) 0%, #c73e1d 100%)',
            boxShadow: '0 12px 32px rgba(229, 0, 68, 0.5)',
          },
        },
      },
    },
    // 警告框样式
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '&.MuiAlert-standardSuccess': {
            backgroundColor: 'rgba(0, 212, 170, 0.1)',
            color: '#00d4aa',
            border: '1px solid rgba(0, 212, 170, 0.3)',
          },
          '&.MuiAlert-standardError': {
            backgroundColor: 'rgba(255, 82, 82, 0.1)',
            color: '#ff5252',
            border: '1px solid rgba(255, 82, 82, 0.3)',
          },
          '&.MuiAlert-standardWarning': {
            backgroundColor: 'rgba(255, 183, 77, 0.1)',
            color: '#ffb74d',
            border: '1px solid rgba(255, 183, 77, 0.3)',
          },
          '&.MuiAlert-standardInfo': {
            backgroundColor: 'rgba(41, 182, 246, 0.1)',
            color: '#29b6f6',
            border: '1px solid rgba(41, 182, 246, 0.3)',
          },
        },
      },
    },
    // 容器样式
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '24px',
          paddingRight: '24px',
        },
      },
    },
    // 工具栏样式
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '80px !important', // 覆盖默认的 minHeight
          height: '100%',
          padding: '0 24px',
          // 响应式设置
          '@media (max-width: 768px)': {
            minHeight: '70px !important',
            padding: '0 16px',
          },
        },
      },
    },
  },
});

export default reactTheme;
