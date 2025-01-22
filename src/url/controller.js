const URL = require("./model");
const requestIp = require("request-ip");
const generateShortUrl = require("../utils/generateShortUrl");

exports.createShortUrl = async (req, res) => {
  try {
    const { originalUrl, alias, expiresAt } = req.body;

    if (!originalUrl) {
      console.error('Error: Original URL is missing');
      return res.status(400).json({ error: 'Original URL is required' });
    }

    // Validate URL format first
    try {
      new globalThis.URL(originalUrl); // Using global URL object
    } catch (err) {
      console.error(`Error: Invalid URL format for ${originalUrl}`, err);
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Check if alias is provided and available
    if (alias) {
      if (alias.length > 20) {
        console.error(`Error: Alias ${alias} exceeds maximum length`);
        return res.status(400).json({ error: 'Alias must be 20 characters or less' });
      }
      const existingAlias = await URL.findOne({ alias });
      if (existingAlias) {
        console.error(`Error: Alias ${alias} already exists`);
        return res.status(400).json({ error: 'Alias already in use' });
      }
    }

    // Generate short URL using our custom function
    let shortUrl = alias;
    let isUnique = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    // If no alias provided, generate unique shortUrl
    if (!shortUrl) {
      while (!isUnique && attempts < MAX_ATTEMPTS) {
        shortUrl = generateShortUrl();
        // eslint-disable-next-line no-await-in-loop
        const existing = await URL.findOne({ shortUrl });
        if (!existing) {
          isUnique = true;
        }
        attempts += 1;
      }

      if (!isUnique) {
        console.error('Error: Could not generate unique short URL');
        return res.status(500).json({ error: 'Could not generate unique short URL' });
      }
    }
    
    const url = new URL({
      originalUrl,
      shortUrl,
      alias,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    await url.save();

    console.log(`Success: Created short URL ${shortUrl} for ${originalUrl}`);
    res.status(201).json({
      shortUrl: `${req.protocol}://${req.get('host')}/${shortUrl}`,
      originalUrl,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
    });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

exports.redirectToUrl = async (req, res) => {
  try {
    const url = await URL.findOne({ shortUrl: req.params.shortUrl });

    if (!url) {
      return res.status(404).json({ error: "URL not found" });
    }

    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).json({ error: "URL has expired" });
    }

    // Get the actual IP address
    const ip = requestIp.getClientIp(req);

    url.clickCount += 1;
    url.visits.push({
      timestamp: new Date(),
      ip: ip,
    });

    await url.save();

    res.redirect(url.originalUrl);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getUrlInfo = async (req, res) => {
  try {
    const url = await URL.findOne({ shortUrl: req.params.shortUrl });

    if (!url) {
      return res.status(404).json({ error: "URL not found" });
    }

    res.json({
      originalUrl: url.originalUrl,
      createdAt: url.createdAt,
      clickCount: url.clickCount,
      expiresAt: url.expiresAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const url = await URL.findOne({ shortUrl: req.params.shortUrl });

    if (!url) {
      return res.status(404).json({ error: "URL not found" });
    }

    const recentVisitors = url.visits.slice(-5).map((visit) => visit.ip);

    res.json({
      clickCount: url.clickCount,
      recentVisitors,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteUrl = async (req, res) => {
  try {
    const url = await URL.findOneAndDelete({ shortUrl: req.params.shortUrl });

    if (!url) {
      return res.status(404).json({ error: "URL not found" });
    }

    res.json({ message: "URL deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
