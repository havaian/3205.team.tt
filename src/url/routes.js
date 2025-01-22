const express = require('express');
const router = express.Router();
const urlController = require('./controller');

// These specific routes should come BEFORE the redirect route
router.post('/shorten', urlController.createShortUrl);
router.get('/info/:shortUrl', urlController.getUrlInfo);
router.get('/analytics/:shortUrl', urlController.getAnalytics);
router.delete('/delete/:shortUrl', urlController.deleteUrl);

// Redirect route should be LAST
router.get('/:shortUrl', urlController.redirectToUrl);

module.exports = router;