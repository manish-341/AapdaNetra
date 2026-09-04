import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          <Paper
            className="glass-card"
            sx={{
              p: 4,
              maxWidth: 500,
              textAlign: 'center',
              border: '1px solid rgba(244, 63, 94, 0.4) !important',
            }}
          >
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#f43f5e', mb: 1 }}>
              Dashboard Telemetry Error
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
              {this.state.error?.message || 'An unexpected rendering error occurred while processing live data.'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReload}
              sx={{
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                fontWeight: 700,
              }}
            >
              Refresh Dashboard
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
