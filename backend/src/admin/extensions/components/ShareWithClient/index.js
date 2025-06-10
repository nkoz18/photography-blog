import React, { useState } from 'react';
import { Box, Typography, Button, Alert } from '@strapi/design-system';
import { useCMEditViewDataManager } from "@strapi/helper-plugin";

const ShareWithClient = () => {
  const { modifiedData, slug, layout } = useCMEditViewDataManager();
  const article = modifiedData;
  const [copied, setCopied] = useState(false);
  
  // Only show for article content type
  if (!layout || layout.apiID !== 'article') {
    return null;
  }

  // Generate the client share URL with token
  const generateShareURL = () => {
    if (!article?.slug || !article?.obscurityToken) {
      return null;
    }

    // Use production URL or localhost for development
    const baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://www.silkytruth.com' 
      : 'http://localhost:3000';
    return `${baseURL}/article/${article.slug}~${article.obscurityToken}`;
  };

  const copyToClipboard = () => {
    const shareURL = generateShareURL();
    if (shareURL) {
      navigator.clipboard.writeText(shareURL).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
      });
    }
  };

  const shareURL = generateShareURL();

  if (!shareURL) {
    return (
      <Box padding={4} background="neutral100" borderRadius="4px">
        <Typography variant="omega" fontWeight="bold">
          Share with Client
        </Typography>
        <Typography variant="pi" textColor="neutral600" marginTop={2}>
          Save the article first to generate a shareable link.
        </Typography>
      </Box>
    );
  }

  return (
    <Box padding={4} background="neutral100" borderRadius="4px">
      <Typography variant="omega" fontWeight="bold" marginBottom={2}>
        Share with Client
      </Typography>
      
      {copied && (
        <Alert closeLabel="Close" variant="success" marginBottom={2}>
          Link copied to clipboard!
        </Alert>
      )}
      
      <Typography variant="pi" textColor="neutral600" marginBottom={3}>
        Share this private link to let clients preview the article:
      </Typography>
      
      <Box 
        padding={2} 
        background="neutral0" 
        borderRadius="4px" 
        border="1px solid neutral200"
        marginBottom={3}
        style={{ wordBreak: 'break-all', fontSize: '12px', fontFamily: 'monospace' }}
      >
        {shareURL}
      </Box>
      
      <Button onClick={copyToClipboard} variant="secondary" size="S">
        Copy Link URL
      </Button>
      
      <Typography variant="pi" textColor="neutral500" marginTop={2}>
        Token: {article.obscurityToken}
      </Typography>
    </Box>
  );
};

export default ShareWithClient;