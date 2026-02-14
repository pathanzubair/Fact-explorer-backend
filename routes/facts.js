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
    const apiKey = 'aabe5b1f108c46f4be78cdac1da11b6e'; 
// This forces the news to be about IP *AND* legal action (stricter)
    const url = `https://newsapi.org/v2/everything?q=("intellectual property" OR patent OR trademark) AND (lawsuit OR infringement OR filing)&language=en&sortBy=publishedAt&apiKey=${apiKey}`;    
    const response = await axios.get(url);
    const articles = response.data.articles.slice(0, 5);

    const newFacts = articles.map(article => ({
      title: article.title,
      description: article.description || "No description available.",
      ipr_type: "News",
      domain: "General",
      year: new Date(article.publishedAt).getFullYear(),
      source: article.source.name
    }));

    await Fact.insertMany(newFacts);
    res.json({ message: `Success! Added ${newFacts.length} live news articles.` });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch from web", error: err.message });
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