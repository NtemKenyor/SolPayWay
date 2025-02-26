const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json()); // Parse JSON requests

// Allowed origins
const allowedOrigins = [
  "http://localhost",
  "http://127.0.0.1",
  "https://roynek.com",
  "https://your-other-domain.com" // you can add  your domain here..
];

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    }
  })
);

// Proxy endpoint to forward requests to Solana RPC
app.post("/proxy", async (req, res) => {
  try {
    const response = await axios.post("https://api.devnet.solana.com/", req.body, {
      headers: { "Content-Type": "application/json" }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server on 127.0.0.1:3001
/* app.listen(3001, "127.0.0.1", () => {
  console.log("Proxy server running on http://127.0.0.1:3001");
}); */

app.listen(3001, () => {
    console.log("Proxy server running on http://127.0.0.1:3001");
});
