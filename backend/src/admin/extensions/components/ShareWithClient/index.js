import React, { useState } from 'react';
import { Box, Typography, Button, Alert } from '@strapi/design-system';
import { useCMEditViewDataManager, auth } from "@strapi/helper-plugin";

const ShareWithClient = () => {
  const { modifiedData, slug, layout } = useCMEditViewDataManager();
  const article = modifiedData;
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Only show for article content type
  if (!layout || layout.apiID !== 'article') {
    return null;
  }

  // Generate the client share URL with token
  const generateShareURL = () => {
    if (!article?.slug || !article?.obscurityToken) {
      return null;
    }

    // Use appropriate base URL based on environment
    const baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://www.silkytruth.com' 
      : 'http://localhost:3000';
    return `${baseURL}/article/${article.slug}~${article.obscurityToken}`;
  };

  const generateShareLink = async () => {
    if (!article?.id) {
      alert('Please save the article first');
      return;
    }

    setIsGenerating(true);
    try {
      // Get the auth token
      const token = auth.getToken();
      
      // Use dedicated token generation endpoint
      const response = await fetch(`/api/articles/${article.id}/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Token generated successfully:', result);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const errorData = await response.text();
        console.error('Failed to generate share link:', response.status, errorData);
        alert(`Failed to generate share link: ${response.status}. Please check your permissions.`);
      }
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('Failed to generate share link. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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
  const hasToken = Boolean(article?.obscurityToken);
  const isSaved = Boolean(article?.id);

  return (
    <Box 
      padding={4} 
      background="neutral0" 
      borderRadius="4px" 
      shadow="tableShadow"
      border="1px solid neutral150"
    >
      <Typography variant="sigma" fontWeight="bold" marginBottom={3}>
        🔗 Share with Client
      </Typography>

      {!isSaved ? (
        <Typography variant="pi" textColor="neutral600" as="p">
          Save the article first to generate a shareable link.
        </Typography>
      ) : !hasToken ? (
        <>
          <Typography variant="pi" textColor="neutral600" marginBottom={3} as="p" style={{ lineHeight: '32px' }}>
            Create a private link to share this article with clients for preview and feedback.
          </Typography>
          <Button 
            onClick={generateShareLink}
            variant="default" 
            size="S" 
            fullWidth
            loading={isGenerating}
            disabled={isGenerating}
          >
            {isGenerating ? 'Creating Share Link...' : 'Create Share Link'}
          </Button>
        </>
      ) : (
        <>
          {copied && (
            <Alert closeLabel="Close" variant="success" marginBottom={3}>
              Link copied to clipboard!
            </Alert>
          )}
          
          <Typography variant="pi" textColor="neutral600" marginBottom={3}>
            Share this private link to let clients preview the article:
          </Typography>
          
          <Box 
            padding={3} 
            background="neutral100" 
            borderRadius="4px" 
            border="1px solid neutral200"
            marginBottom={3}
            style={{ wordBreak: 'break-all', fontSize: '12px', fontFamily: 'monospace' }}
          >
            {shareURL}
          </Box>
          
          <Button onClick={copyToClipboard} variant="default" size="S" fullWidth>
            Copy Link URL
          </Button>
          
          <Typography variant="pi" textColor="neutral500" marginTop={3} style={{ fontSize: '11px' }}>
            Token: {article.obscurityToken}
          </Typography>
        </>
      )}
    </Box>
  );
};

export default ShareWithClient;