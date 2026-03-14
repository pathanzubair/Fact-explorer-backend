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

// 🟢 FETCH NEWS API (Advanced Domain-Specific IPR Facts)
router.post('/fetch-news', async (req, res) => {
    try {
        // 1. Refined Category Clusters for 100+ Diverse Facts
        const categories = [
            { type: 'Patent', domain: 'Technology', query: 'groundbreaking computing patent history facts' },
            { type: 'Trade Secret', domain: 'Technology', query: 'famous tech industry trade secret examples' },
            { type: 'Trademark', domain: 'Fashion', query: 'iconic fashion brand trademark history facts' },
            { type: 'Copyright', domain: 'Fashion', query: 'fashion design copyright law cases trivia' },
            { type: 'Trade Secret', domain: 'Food & Beverage', query: 'famous recipe trade secret facts history' },
            { type: 'Trademark', domain: 'Food & Beverage', query: 'food industry brand trademark origins' },
            { type: 'Patent', domain: 'Healthcare', query: 'medical research patent breakthrough history' },
            { type: 'Copyright', domain: 'Healthcare', query: 'medical journal copyright law facts' },
            { type: 'Copyright', domain: 'Entertainment', query: 'famous movie music copyright history facts' },
            { type: 'Trademark', domain: 'Entertainment', query: 'entertainment character trademark legal trivia' }
            { type: 'Patent', domain: 'Technology', query: 'first software patent history facts "did you know"' },
    { type: 'Trade Secret', domain: 'Technology', query: 'famous algorithm trade secret examples' },
    
    // 👗 FASHION & LUXURY
    { type: 'Trademark', domain: 'Fashion', query: 'luxury brand trademark logo origins history' },
    { type: 'Copyright', domain: 'Fashion', query: 'high fashion design copyright legal trivia' },
    
    // 🍔 FOOD & AGRICULTURE
    { type: 'Trade Secret', domain: 'Food & Beverage', query: 'secret recipe history Coca-Cola KFC facts' },
    { type: 'Patent', domain: 'Food & Beverage', query: 'genetically modified food patent history' },
    
    // 🏥 HEALTHCARE & PHARMA
    { type: 'Patent', domain: 'Healthcare', query: 'famous life-saving medicine patent breakthrough' },
    { type: 'Copyright', domain: 'Healthcare', query: 'medical diagram copyright legal cases' },
    
    // 🎬 ENTERTAINMENT & MEDIA
    { type: 'Copyright', domain: 'Entertainment', query: 'Disney character copyright history Mickey Mouse' },
    { type: 'Trademark', domain: 'Entertainment', query: 'famous movie title trademark legal trivia' },

    // 🏎️ AUTOMOTIVE (New)
    { type: 'Patent', domain: 'Technology', query: 'safety belt patent history Volvo facts' },
    { type: 'Trademark', domain: 'Technology', query: 'car brand logo trademark evolution history' },

    // 🎮 GAMING & TOYS (New)
    { type: 'Copyright', domain: 'Entertainment', query: 'video game character copyright history facts' },
    { type: 'Patent', domain: 'Technology', query: 'LEGO brick patent history interesting facts' },

    // 🌿 SUSTAINABILITY (New)
    { type: 'Patent', domain: 'Healthcare', query: 'solar panel patent history green technology' }
        ];

        // 2. Randomly pick one domain/category pair per click
        const selected = categories[Math.floor(Math.random() * categories.length)];

        // 3. Fetch exactly 5 articles using the targeted query
        const response = await axios.get(
            `https://newsapi.org/v2/everything?q=${encodeURIComponent(selected.query)}&language=en&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`
        );

        const articles = response.data.articles;

        // 4. Map the API response to your Specific Domains and IPR Types
        const iprItems = articles.map(article => ({
            title: article.title,
            description: article.description || "Historical IPR case details available in the source link.",
            ipr_type: selected.type, // 🟢 Correctly tags as Patent, Trademark, etc.
            domain: selected.domain, // 🟢 Correctly tags as Healthcare, Fashion, etc.
            year: new Date(article.publishedAt).getFullYear() || 2026,
            source: article.url
        }));

        // 5. 'ordered: false' allows skipping duplicates without crashing
        await Fact.insertMany(iprItems, { ordered: false });
        
        res.status(200).json({ message: `Success! Added 5 new ${selected.domain} ${selected.type} facts.` });
    } catch (error) {
        // If it's a duplicate (code 11000), skip gracefully
        if (error.code === 11000) {
            return res.status(200).json({ message: "Fetch complete (any duplicates were skipped)!" });
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