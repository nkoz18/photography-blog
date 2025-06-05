/**
 * Upload functionality tests
 * Run these to verify upload features work correctly
 * Author: Nikita Kozlov
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = process.env.BACKEND_URL || 'https://[BACKEND_URL]';
const TEST_EMAIL = process.env.TEST_EMAIL || '[TEST_EMAIL]';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '[TEST_PASSWORD]';

let authToken = '';

/**
 * Get authentication token for testing
 */
async function authenticate() {
    try {
        const response = await axios.post(`${BACKEND_URL}/api/auth/local`, {
            identifier: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        authToken = response.data.jwt;
        console.log('✓ Authentication successful');
        return true;
    } catch (error) {
        console.error('✗ Authentication failed:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Test single file upload
 */
async function testSingleUpload() {
    console.log('\n--- Testing Single File Upload ---');
    
    // Create test image if it doesn't exist
    const testImagePath = path.join(__dirname, 'test-single.jpg');
    if (!fs.existsSync(testImagePath)) {
        console.log('Creating test image...');
        // Create a small test image (you'd normally have this ready)
        return false;
    }

    const form = new FormData();
    form.append('files', fs.createReadStream(testImagePath));

    try {
        const response = await axios.post(`${BACKEND_URL}/api/upload`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log('✓ Single upload successful');
        console.log(`  Uploaded file ID: ${response.data[0].id}`);
        return response.data[0].id;
    } catch (error) {
        console.error('✗ Single upload failed:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Test batch file upload
 */
async function testBatchUpload(fileCount = 3) {
    console.log(`\n--- Testing Batch Upload (${fileCount} files) ---`);
    
    const form = new FormData();
    
    // Add multiple files
    for (let i = 1; i <= fileCount; i++) {
        const testImagePath = path.join(__dirname, `test-batch-${i}.jpg`);
        if (fs.existsSync(testImagePath)) {
            form.append('files', fs.createReadStream(testImagePath));
        } else {
            console.log(`Warning: ${testImagePath} not found`);
        }
    }

    try {
        const response = await axios.post(`${BACKEND_URL}/api/upload`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${authToken}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        console.log(`✓ Batch upload successful (${response.data.length} files)`);
        return true;
    } catch (error) {
        console.error('✗ Batch upload failed:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.error('  This is the 401 error we need to fix!');
        }
        return false;
    }
}

/**
 * Test large file upload
 */
async function testLargeFileUpload() {
    console.log('\n--- Testing Large File Upload ---');
    
    const largeImagePath = path.join(__dirname, 'test-large.jpg');
    if (!fs.existsSync(largeImagePath)) {
        console.log('⚠ Large test file not found, skipping test');
        return null;
    }

    const stats = fs.statSync(largeImagePath);
    console.log(`  File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    const form = new FormData();
    form.append('files', fs.createReadStream(largeImagePath));

    try {
        const response = await axios.post(`${BACKEND_URL}/api/upload`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${authToken}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 300000 // 5 minute timeout for large files
        });
        
        console.log('✓ Large file upload successful');
        return true;
    } catch (error) {
        console.error('✗ Large file upload failed:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Test pagination settings
 */
async function testPagination() {
    console.log('\n--- Testing Media Library Pagination ---');
    
    try {
        // This would need to be adapted based on your API structure
        const response = await axios.get(`${BACKEND_URL}/api/upload/files`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            params: {
                pagination: {
                    pageSize: 100
                }
            }
        });
        
        console.log(`✓ Pagination test successful`);
        console.log(`  Files returned: ${response.data.results?.length || response.data.length}`);
        return true;
    } catch (error) {
        console.error('✗ Pagination test failed:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('=== Starting Upload Tests ===\n');
    
    const results = {
        passed: 0,
        failed: 0,
        skipped: 0
    };

    // Authenticate first
    if (!await authenticate()) {
        console.error('\nCannot proceed without authentication');
        process.exit(1);
    }

    // Run tests
    const tests = [
        { name: 'Single Upload', fn: testSingleUpload },
        { name: 'Batch Upload', fn: testBatchUpload },
        { name: 'Large File Upload', fn: testLargeFileUpload },
        { name: 'Pagination', fn: testPagination }
    ];

    for (const test of tests) {
        const result = await test.fn();
        if (result === null) {
            results.skipped++;
        } else if (result) {
            results.passed++;
        } else {
            results.failed++;
        }
    }

    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`✓ Passed: ${results.passed}`);
    console.log(`✗ Failed: ${results.failed}`);
    console.log(`⚠ Skipped: ${results.skipped}`);

    // Update test results in context file
    const timestamp = new Date().toISOString();
    const resultLine = `${timestamp} - Tests: ${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped\n`;
    fs.appendFileSync('test-results.log', resultLine);

    process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (require.main === module) {
    runAllTests();
}

module.exports = { runAllTests };