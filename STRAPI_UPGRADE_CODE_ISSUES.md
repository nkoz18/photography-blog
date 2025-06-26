# Strapi Upgrade: Problematic Code Snippets

This document contains all the problematic code snippets that need to be updated for Strapi v4.6+/v5.0 upgrade, organized by file path and issue type.

## Critical Issues - Design System Import Changes

### 1. ShareArticleUrl Component
**File:** `backend/src/admin/extensions/components/ShareArticleUrl/index.js`

**Problematic Code:**
```javascript
import { Box } from '@strapi/design-system/Box';
import { Typography } from '@strapi/design-system/Typography';
import { TextInput } from '@strapi/design-system/TextInput';
import { Button } from '@strapi/design-system/Button';
import { Stack } from '@strapi/design-system/Stack';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
```

**Required Changes:**
- Change all design system imports to root imports: `import { Box, Typography, TextInput, Button, Stack } from '@strapi/design-system';`
- Replace helper-plugin import: `import { useCMEditViewDataManager } from '@strapi/strapi/admin';`

### 2. ImageFocalPoint Component
**File:** `backend/src/admin/extensions/components/ImageFocalPoint/index.js`

**Problematic Code:**
```javascript
import { Box } from '@strapi/design-system/Box';
import { Typography } from '@strapi/design-system/Typography';
import { Accordion } from '@strapi/design-system/Accordion';
import { Button } from '@strapi/design-system/Button';
import { Stack } from '@strapi/design-system/Stack';
import { useCMEditViewDataManager, request, useNotification } from '@strapi/helper-plugin';
```

**Required Changes:**
- Change to root imports: `import { Box, Typography, Accordion, Button, Stack } from '@strapi/design-system';`
- Replace helper-plugin imports: `import { useCMEditViewDataManager, request, useNotification } from '@strapi/strapi/admin';`

### 3. BatchImageUpload Component
**File:** `backend/src/admin/extensions/components/BatchImageUpload/index.js`

**Problematic Code:**
```javascript
import { Button } from '@strapi/design-system/Button';
import { Typography } from '@strapi/design-system/Typography';
import { Box } from '@strapi/design-system/Box';
import { Alert } from '@strapi/design-system/Alert';
import { Upload } from '@strapi/icons';
import { useCMEditViewDataManager, auth } from '@strapi/helper-plugin';
```

**Critical Issues:**
- **Alert component** is known to cause white screen crashes in v4.2.0 and likely deprecated in v5
- **@strapi/icons** package may not exist in v4.2.0
- Helper-plugin dependencies need migration

**Required Changes:**
- Remove Alert component usage or replace with custom Box styling
- Change to root imports: `import { Button, Typography, Box } from '@strapi/design-system';`
- Replace helper-plugin: `import { useCMEditViewDataManager, auth } from '@strapi/strapi/admin';`
- Find alternative to @strapi/icons or implement custom icons

### 4. ReportsManagement Component
**File:** `backend/src/admin/extensions/components/ReportsManagement/index.js`

**Problematic Code:**
```javascript
// Extensive design system usage with individual imports
import { Table } from '@strapi/design-system/Table';
import { Dialog } from '@strapi/design-system/Dialog';
import { Badge } from '@strapi/design-system/Badge';
import { Select } from '@strapi/design-system/Select';
// ... many more individual imports
```

**Required Changes:**
- Consolidate all imports to root: `import { Table, Dialog, Badge, Select, ... } from '@strapi/design-system';`

### 5. ErrorBoundary Component
**File:** `backend/src/admin/extensions/components/ErrorBoundary/index.js`

**Problematic Code:**
```javascript
import { Typography } from '@strapi/design-system/Typography';
import { Box } from '@strapi/design-system/Box';
import { Alert } from '@strapi/design-system/Alert';
```

**Required Changes:**
- Change to root imports: `import { Typography, Box } from '@strapi/design-system';`
- Remove or replace Alert component with custom styling

### 6. CustomGalleryCSS Component
**File:** `backend/src/admin/extensions/components/CustomGalleryCSS/index.js`

**Problematic Code:**
```javascript
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
```

**Required Changes:**
- Replace with: `import { useCMEditViewDataManager } from '@strapi/strapi/admin';`

## Critical Issues - Entity Service API Migration

### 7. Article Controller
**File:** `backend/src/api/article/controllers/article.js`

**Problematic Code:**
```javascript
// Line 57
const article = await strapi.entityService.findOne("api::article.article", id, {
  populate: {
    gallery: {
      populate: {
        gallery_items: {
          populate: {
            image: true,
          },
        },
      },
    },
  },
});

// Line 144
await strapi.entityService.update("api::article.article", id, {
  data: {
    gallery: galleryData,
  },
});

// Line 151
const updatedArticle = await strapi.entityService.findOne("api::article.article", id, {
  populate: {
    gallery: {
      populate: {
        gallery_items: {
          populate: {
            image: true,
          },
        },
      },
    },
  },
});

// Line 190
const updatedArticle = await strapi.entityService.update(
  "api::article.article",
  id,
  {
    data: {
      gallery: {
        caption: galleryData.caption,
        gallery_items: allItems,
      },
    },
  }
);
```

**Required Changes:**
```javascript
// Replace entityService.findOne with documents().findOne
const article = await strapi.documents("api::article.article").findOne({
  documentId: id,
  populate: {
    gallery: {
      populate: {
        gallery_items: {
          populate: {
            image: true,
          },
        },
      },
    },
  },
});

// Replace entityService.update with documents().update
await strapi.documents("api::article.article").update({
  documentId: id,
  data: {
    gallery: galleryData,
  },
});
```

### 8. Photo Encounter Lifecycle
**File:** `backend/src/api/photo-encounter/content-types/photo-encounter/lifecycles.js`

**Problematic Code:**
```javascript
// Entity Service usage in lifecycle hooks
await strapi.entityService.update(/* ... */);
```

**Required Changes:**
- Replace all `strapi.entityService` calls with `strapi.documents(uid)` calls
- Update method signatures to use `documentId` instead of `id`

### 9. Bootstrap Configuration
**File:** `backend/bootstrap.js`

**Problematic Code:**
```javascript
// Entity Service usage for seed data
await strapi.entityService.create(/* ... */);
await strapi.entityService.findMany(/* ... */);
```

**Required Changes:**
- Migrate all Entity Service calls to Document Service API
- Update query parameters and response handling

## Critical Issues - Upload Plugin Extension

### 10. Upload Plugin Server Extension
**File:** `backend/src/extensions/upload/strapi-server.js`

**Problematic Code:**
```javascript
// Line 82-104: Direct database query usage
const fileModel = strapi.query("plugin::upload.file");
const file = await fileModel.findOne({
  where: { id },
});

const updatedFile = await fileModel.update({
  where: { id },
  data: {
    provider_metadata: providerMetadata,
  },
});

// Line 320-346: Service override
const formatFile = plugin.services.upload.formatFileInfo;
plugin.services.upload.formatFileInfo = (file) => {
  // Custom formatting logic
};

// Line 349-358: Service method override
const originalGetSignedUrl = plugin.services.upload.getSignedUrl;
plugin.services.upload.getSignedUrl = (file) => {
  // Custom URL logic
};

// Line 361-405: Route registration
plugin.routes.admin.routes.push({
  method: "POST",
  path: "/updateFocalPoint/:id",
  handler: "upload.updateFocalPoint",
  config: {
    policies: [],
    auth: { scope: ["admin"] },
  },
});
```

**Required Changes:**
- **Complete rewrite likely required** - Plugin architecture has changed significantly
- Route registration API may have changed
- Service override patterns may no longer be supported
- Database query patterns need Document Service migration

## Critical Issues - Admin Component Registration

### 11. Admin App Configuration
**File:** `backend/src/admin/app.js`

**Problematic Code:**
```javascript
// Component injection API usage
export default {
  config: {
    // Custom component registration
  },
  bootstrap(app) {
    // Component injection logic
  },
};
```

**Required Changes:**
- Update component injection API calls
- Replace `injectContentManagerComponent()` with `getPlugin('content-manager').injectComponent()`

## Medium Risk Issues

### 12. Factory Imports
**File:** `backend/src/api/article/controllers/article.js` (Line 7)

**Problematic Code:**
```javascript
const { createCoreController } = require("@strapi/strapi").factories;
```

**Required Changes:**
- Factory import paths may have changed - verify current path structure

### 13. Utils Imports
**File:** `backend/src/api/article/controllers/article.js` (Line 8)

**Problematic Code:**
```javascript
const utils = require("@strapi/utils");
const { UnauthorizedError } = utils.errors;
```

**Required Changes:**
- `@strapi/utils` package has been refactored - verify new import structure

## Summary of Files Requiring Updates

### Admin Components (8 files):
1. `backend/src/admin/extensions/components/ShareArticleUrl/index.js`
2. `backend/src/admin/extensions/components/ImageFocalPoint/index.js`
3. `backend/src/admin/extensions/components/BatchImageUpload/index.js`
4. `backend/src/admin/extensions/components/ReportsManagement/index.js`
5. `backend/src/admin/extensions/components/ErrorBoundary/index.js`
6. `backend/src/admin/extensions/components/CustomGalleryCSS/index.js`
7. `backend/src/admin/app.js`
8. `backend/src/admin/package.json` (dependency updates)

### API & Backend (5+ files):
1. `backend/src/api/article/controllers/article.js`
2. `backend/src/extensions/upload/strapi-server.js` (MAJOR REWRITE)
3. `backend/src/api/photo-encounter/content-types/photo-encounter/lifecycles.js`
4. `backend/bootstrap.js`
5. `backend/src/index.js`

### Configuration:
1. `backend/package.json` (dependency updates)
2. `backend/config/plugins.js` (potential updates)

**Total Files Affected:** 15+ files requiring code changes
**Estimated Lines of Code to Modify:** 1000+ lines
**Critical Dependencies:** Design System, Helper Plugin, Entity Service API, Upload Plugin Architecture