const factSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true }, // 🟢 Added unique: true
  description: { type: String, required: true },
  ipr_type: String,
  domain: String,
  year: Number,
  source: String,
  createdAt: { type: Date, default: Date.now }
});