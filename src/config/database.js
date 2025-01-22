const mongoose = require("mongoose");

const connectDB = async (uri) => {
  try {
    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`✅ MONGO`);
  } catch (error) {
    console.error(`❌MongoDB connection error: ${error.message}`);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.error("❌MongoDB Disconnected");
  } catch (error) {
    console.error(`❌Error disconnecting: ${error.message}`);
    throw error;
  }
};

module.exports = { connectDB, disconnectDB };
