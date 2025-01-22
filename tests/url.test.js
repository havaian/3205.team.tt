const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { disconnectDB } = require("../src/config/database");
const URL = require("../src/url/model");

let mongoServer;
let app;

describe("URL Shortener API", () => {
  beforeAll(async () => {
    // Disconnect from any existing connection
    await disconnectDB();

    // Create new memory server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri);

    // Import app after connecting to the test database
    app = require("../src/index");
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.collection("urls").deleteMany({});
  });

  describe("POST /api/shorten", () => {
    it("should create a short URL with custom alias", async () => {
      const response = await request(app).post("/api/shorten").send({
        originalUrl: "https://example.com",
        alias: "custom-test",
      });

      expect(response.status).toBe(201);
      expect(response.body.shortUrl).toContain("custom-test");
      expect(response.body.originalUrl).toBe("https://example.com");
    });

    it("should reject duplicate alias", async () => {
      // First create a URL with custom alias
      await request(app).post("/api/shorten").send({
        originalUrl: "https://example.com",
        alias: "my-alias",
      });

      // Try to create another URL with the same alias
      const response = await request(app).post("/api/shorten").send({
        originalUrl: "https://another-example.com",
        alias: "my-alias",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Redirection and Analytics", () => {
    it("should redirect and track analytics correctly", async () => {
      const createResponse = await request(app)
        .post("/api/shorten")
        .send({
          originalUrl: "https://example.com"
        });
  
      expect(createResponse.status).toBe(201);
      expect(createResponse.body).toHaveProperty("shortUrl");
      
      // Extract shortUrl from the full URL using global URL object
      const shortUrl = createResponse.body.shortUrl.split('/').pop();
  
      // Visit the URL multiple times
      await request(app).get(`/${shortUrl}`).redirects(1);
      await request(app).get(`/${shortUrl}`).redirects(1);
      await request(app).get(`/${shortUrl}`).redirects(1);
  
      const analyticsResponse = await request(app)
        .get(`/api/analytics/${shortUrl}`);
  
      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.body.clickCount).toBe(3);
      expect(Array.isArray(analyticsResponse.body.recentVisitors)).toBeTruthy();
    });
  });
});
