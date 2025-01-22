const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
    unique: true,
  },
  alias: {
    type: String,
    unique: true,
    sparse: true,
    maxLength: 20,
  },
  clickCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  visits: [
    {
      timestamp: Date,
      ip: String,
    },
  ],
});

module.exports = mongoose.model("Url", urlSchema);
