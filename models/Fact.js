const mongoose = require('mongoose');

const FactSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  
  ipr_type: { 
    type: String, 
    required: true, 
    enum: ['Patent', 'Copyright', 'Trademark', 'Trade Secret', 'News'] 
  },
  
  domain: { 
    type: String, 
    required: true, 
    enum: ['Technology', 'Entertainment', 'Fashion', 'Food & Beverage', 'Healthcare', 'General'] 
  },

  // 🟢 NEW FIELD: REGION
  region: {
    type: String,
    required: true,
    enum: ['Global', 'North America', 'Europe', 'Asia', 'India', 'Other'],
    default: 'Global'
  },

  year: { type: Number, required: true },
  source: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Fact', FactSchema);