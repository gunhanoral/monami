import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

const Logo = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Crown Icon inspired by Monami box */}
      <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M20 70 L20 30 L40 50 L60 30 L80 50 L80 70 Z" 
          fill={theme.palette.primary.main} 
          stroke={theme.palette.text.primary} 
          strokeWidth="3"
          strokeLinejoin="round"
        />
         <path 
          d="M20 30 L10 20" 
          stroke={theme.palette.secondary.main} 
          strokeWidth="4" 
          strokeLinecap="round"
        />
        <path 
          d="M40 50 L40 20" 
          stroke={theme.palette.success.main} 
          strokeWidth="4" 
          strokeLinecap="round"
        />
        <path 
          d="M60 30 L60 15" 
          stroke={theme.palette.info.main} 
          strokeWidth="4" 
          strokeLinecap="round"
        />
        <path 
          d="M80 50 L90 40" 
          stroke={theme.palette.secondary.main} 
          strokeWidth="4" 
          strokeLinecap="round"
        />
        {/* Base of crown */}
        <rect x="20" y="70" width="60" height="10" fill="#212121" />
      </svg>
      
      <Typography 
        variant="h5" 
        component="div" 
        sx={{ 
          fontWeight: 800, 
          letterSpacing: '-0.02em',
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: { xs: 'none', sm: 'block' }
        }}
      >
        monami
      </Typography>
    </Box>
  );
};

export default Logo;
