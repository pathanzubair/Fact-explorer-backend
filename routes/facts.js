const express = require('express');
const router = express.Router();
const Fact = require('../models/Fact');
const axios = require('axios');

// GET all facts
router.get('/', async (req, res) => {
  try {
    const { ipr_type, domain, sort, search } = req.query;
    let query = {};
    if (ipr_type && ipr_type !== 'All') query.ipr_type = ipr_type;
    if (domain && domain !== 'All') query.domain = domain;
    if (search) query.title = { $regex: search, $options: 'i' };
    
    let sortOptions = { year: -1 };
    if (sort === 'Oldest') sortOptions = { year: 1 };

    const facts = await Fact.find(query).sort(sortOptions);
    res.json(facts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST new fact
router.post('/', async (req, res) => {
  const fact = new Fact({
    title: req.body.title,
    description: req.body.description,
    ipr_type: req.body.ipr_type,
    domain: req.body.domain,
    year: req.body.year,
    source: req.body.source
  });
  try {
    const newFact = await fact.save();
    res.status(201).json(newFact);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE fact
router.delete('/:id', async (req, res) => {
  try {
    await Fact.findByIdAndDelete(req.params.id);
    res.json({ message: 'Fact Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 🟢 FETCH NEWS API (Your Dynamic Feature)
router.post('/fetch-news', async (req, res) => {
    try {
        // 🟢 Specific IPR categories to replace "News"
        const iprOptions = [
            { type: 'Patent', query: 'latest breakthrough technology patent' },
            { type: 'Trademark', query: 'iconic fashion brand trademark' },
            { type: 'Copyright', query: 'famous movie character copyright law' }
        ];

        // Randomly pick one for true dynamic content
        const selected = iprOptions[Math.floor(Math.random() * iprOptions.length)];

        // Using your existing NEWS_API_KEY from .env
        const response = await axios.get(`https://newsapi.org/v2/everything?q=${selected.query}&apiKey=${process.env.NEWS_API_KEY}`);

        const iprItems = response.data.articles.slice(0, 5).map(article => ({
            title: article.title,
            description: article.description || "IPR Details pending...",
            ipr_type: selected.type, // 🟢 This officially replaces "News"
            domain: selected.type === 'Patent' ? 'Tech' : 'Legal', 
            year: 2026,
            source: article.url
        }));

        // 🟢 The 'ordered: false' trick skips duplicates automatically
        await Fact.insertMany(iprItems, { ordered: false });
        
        res.status(200).json({ message: `Success! Added ${selected.type} facts.` });
    } catch (error) {
        // If it's a duplicate (code 11000), don't show an error to the user
        if (error.code === 11000) {
            return res.status(200).json({ message: "Fetched, but these facts were already known!" });
        }
        res.status(500).json({ error: error.message });
    }
});

// RESET DB
router.post('/seed', async (req, res) => {
  const hugeFactList = [
    { title: "The First Computer Mouse", description: "Douglas Engelbart patented the first computer mouse in 1970.", ipr_type: "Patent", domain: "Technology", year: 1970, source: "US Patent 3,541,541" },
    { title: "Mickey Mouse Copyright", description: "The original Mickey Mouse (Steamboat Willie) entered the public domain on Jan 1, 2024.", ipr_type: "Copyright", domain: "Entertainment", year: 2024, source: "US Copyright Office" },
    { title: "Nike Swoosh", description: "Carolyn Davidson designed the Nike Swoosh for only $35 in 1971.", ipr_type: "Trademark", domain: "Fashion", year: 1971, source: "Nike Inc." },
    { title: "Coca-Cola Formula", description: "The recipe for Coca-Cola is one of the world's most famous trade secrets.", ipr_type: "Trade Secret", domain: "Food & Beverage", year: 1886, source: "World of Coke" }
  ];
  try {
    await Fact.deleteMany({});
    await Fact.insertMany(hugeFactList);
    res.json({ message: "Database Reset!" }); 
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;