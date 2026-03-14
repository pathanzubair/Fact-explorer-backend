const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Force Google DNS to resolve SRV records

require('dotenv').config();
// ... rest of your code
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const factRoutes = require('./routes/facts');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Middleware - Ensure CORS allows your specific Frontend URL
app.use(cors()); 
app.use(express.json());

// 2. Health Check Route (Add this to verify the backend is actually "awake")
app.get('/', (req, res) => {
  res.send("🚀 Fact Explorer Backend is Live and Running!");
});

// 3. Routes
app.use('/api/facts', factRoutes);

// 4. Database Connection (Optimized for Cloud/Render)
// Note: Render uses MONGO_URI from your Environment Variables dashboard
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected successfully (Cloud/Atlas)"))
  .catch(err => {
      console.error("❌ MongoDB Connection Error:", err.message);
      // Removed the "Local Task Manager" tip since this is now on Render
  });

// 5. Global Error Handler (Prevents the server from crashing on bad requests)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong on the server!" });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));