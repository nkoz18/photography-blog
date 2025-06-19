import React, { useState } from 'react';
import { Box } from '@strapi/design-system/Box';
import { Typography } from '@strapi/design-system/Typography';
import { TextInput } from '@strapi/design-system/TextInput';
import { Button } from '@strapi/design-system/Button';
import { Stack } from '@strapi/design-system/Stack';
import { useCMEditViewDataManager } from "@strapi/helper-plugin";

const ShareArticleUrl = () => {
  console.log('ShareArticleUrl: Component starting to render');
  
  // ALL HOOKS MUST BE AT THE TOP LEVEL - NO CONDITIONS BEFORE THEM
  const [copied, setCopied] = useState(false);
  
  try {
    const { modifiedData, layout, isCreatingEntry } = useCMEditViewDataManager();
    console.log('ShareArticleUrl: Hook data:', { modifiedData, layout, isCreatingEntry });
    
    // Only show this component on the article content type
    console.log('ShareArticleUrl: Layout check:', layout);
    if (!layout || layout.apiID !== 'article') {
      console.log('ShareArticleUrl: Not article layout, returning null');
      return null;
    }
  
    // Don't show while creating a new article (no slug yet)
    if (isCreatingEntry) {
      console.log('ShareArticleUrl: Creating entry, showing save message');
      return (
        <Box padding={4} background="neutral100" hasRadius>
          <Typography variant="omega">
            Save the article to generate a shareable URL
          </Typography>
        </Box>
      );
    }
    
    // Wait for data to be loaded
    if (!modifiedData || !modifiedData.slug) {
      console.log('ShareArticleUrl: No data or slug, returning null');
      return null;
    }
    
    console.log('ShareArticleUrl: Rendering main component');
    // Detect environment and set appropriate frontend URL
    const isDevelopment = window.location.hostname === 'localhost';
    const frontendUrl = isDevelopment 
      ? 'http://localhost:3000' 
      : (process.env.STRAPI_ADMIN_FRONTEND_URL || 'https://www.silkytruth.com');
    const shareUrl = `${frontendUrl}/article/${modifiedData.slug}`;
    const isListed = modifiedData.listed === true;
    
    const copyToClipboard = () => {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    
    console.log('ShareArticleUrl: About to return JSX');
    return (
      <Box padding={4} background="neutral100" hasRadius>
        <Typography variant="beta" marginBottom={2}>
          Article URL
        </Typography>
        
        <Box 
          marginBottom={3} 
          padding={3} 
          background={isListed ? "success100" : "warning100"} 
          hasRadius
        >
          <Typography variant="omega">
            {isListed ? "Public Article" : "Unlisted Article"}
          </Typography>
          <Typography variant="omega">
            {isListed 
              ? "This article is listed and will appear in navigation and search results."
              : "This article is unlisted. Share this URL for private preview. It won't appear in navigation or search engines."
            }
          </Typography>
        </Box>
        
        <Stack spacing={2} horizontal>
          <TextInput
            value={shareUrl}
            readOnly
            aria-label="Article URL"
            style={{ flexGrow: 1 }}
          />
          <Button
            onClick={copyToClipboard}
            size="S"
            variant="secondary"
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </Stack>
      </Box>
    );
  } catch (error) {
    console.error('ShareArticleUrl: Error in component:', error);
    return (
      <Box padding={4} background="danger100" hasRadius>
        <Typography variant="omega" textColor="danger600">
          Error loading share component: {error.message}
        </Typography>
      </Box>
    );
  }
};

export default ShareArticleUrl;