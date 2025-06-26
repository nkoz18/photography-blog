import React from "react";
import { Typography } from "@strapi/design-system/Typography";
import { Box } from "@strapi/design-system/Box";
import { Alert } from "@strapi/design-system/Alert";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error with detailed information
    console.error("[ErrorBoundary] Component error caught:", {
      error: error.message,
      stack: error.stack,
      errorInfo: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      component: this.props.componentName || "Unknown"
    });

    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Optional: Send error to monitoring service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      const componentName = this.props.componentName || "Component";
      
      return (
        <Box padding={4} background="neutral100" hasRadius>
          <Alert 
            closeLabel="Close alert" 
            title={`${componentName} Error`}
            variant="danger"
          >
            <Typography variant="omega">
              {this.props.fallbackMessage || 
               `The ${componentName} component encountered an error and couldn't be displayed.`}
            </Typography>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box marginTop={2}>
                <Typography variant="pi" textColor="neutral600">
                  <strong>Error:</strong> {this.state.error.message}
                </Typography>
                {this.state.errorInfo && (
                  <Box marginTop={1}>
                    <Typography variant="pi" textColor="neutral600" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;