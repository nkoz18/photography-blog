'use strict';

module.exports = ({ strapi }) => ({
  async send(phone, message) {
    try {
      // Check if AWS credentials are configured
      const awsRegion = process.env.AWS_REGION;
      const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
      const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
      
      if (!awsRegion || !awsAccessKey || !awsSecretKey) {
        strapi.log.info('AWS credentials not configured, logging SMS instead:', {
          phone,
          message
        });
        return { success: true, mock: true };
      }
      
      // Import AWS SDK v3 SNS client
      const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
      
      const snsClient = new SNSClient({
        region: awsRegion,
        credentials: {
          accessKeyId: awsAccessKey,
          secretAccessKey: awsSecretKey
        }
      });
      
      const params = {
        PhoneNumber: phone,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional'
          }
        }
      };
      
      const command = new PublishCommand(params);
      const result = await snsClient.send(command);
      
      strapi.log.info('SMS sent successfully:', {
        phone: phone.replace(/\d(?=\d{4})/g, '*'), // Mask phone number
        messageId: result.MessageId
      });
      
      return { success: true, messageId: result.MessageId };
      
    } catch (error) {
      // Handle opt-out scenarios
      if (error.code === 'InvalidParameter' && error.message.includes('opted out')) {
        strapi.log.warn('Phone number has opted out:', phone.replace(/\d(?=\d{4})/g, '*'));
        return { success: false, optedOut: true };
      }
      
      strapi.log.error('SMS sending failed:', error);
      throw error;
    }
  },
  
  formatPhotoReadyMessage(placeName, slug) {
    const baseUrl = process.env.FRONTEND_URL || 'https://silkytruth.com';
    const url = `${baseUrl}/x/${slug}`;
    
    if (placeName) {
      return `📸 Your Silky Truth photos from ${placeName} are live! ${url}`;
    } else {
      return `📸 Your Silky Truth photos are live! ${url}`;
    }
  }
});