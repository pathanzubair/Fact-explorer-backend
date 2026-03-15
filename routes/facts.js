const express = require('express');
const router = express.Router();
const Fact = require('../models/Fact');
const axios = require('axios');

// 1. GET all facts (Supports filtering and sorting)
router.get('/', async (req, res) => {
  try {
    const { ipr_type, domain, sort, search } = req.query;
    let query = {};

    if (ipr_type && ipr_type !== 'All') query.ipr_type = ipr_type;
    if (domain && domain !== 'All') query.domain = domain;
    if (search) query.title = { $regex: search, $options: 'i' };
    
    let sortOptions = { year: -1 }; 
    if (sort === 'Oldest' || sort === 'Oldest First') {
      sortOptions = { year: 1 };
    } else {
      sortOptions = { year: -1 };
    }

    const facts = await Fact.find(query).sort(sortOptions);
    res.json(facts);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// 2. LIVE FETCH NEWS (Appends to DB, keeping older facts)
// 🟢 DIVERSE IPR SYNC (Fetches a mix of types in one click)
router.post('/fetch-news', async (req, res) => {
    try {
        const diversityCategories = [
            { type: 'Patent', domain: 'Technology', query: 'latest AI patent' },
            { type: 'Trademark', domain: 'Fashion', query: 'brand trademark registration' },
            { type: 'Trade Secret', domain: 'Food & Beverage', query: 'famous secret recipe' },
            { type: 'Copyright', domain: 'Entertainment', query: 'recent movie copyright' },
            { type: 'Industrial Design', domain: 'Automobile', query: 'car design patent' }
        ];

        // 1. Shuffle the categories so the "mix" is different every time
        const shuffledCategories = diversityCategories.sort(() => 0.5 - Math.random());
        
        let diverseItems = [];

        // 2. Loop through the first 5 categories and fetch 1 fact for each
        for (let i = 0; i < 5; i++) {
            const cat = shuffledCategories[i];
            const response = await axios.get(
                `https://newsapi.org/v2/everything?q=${encodeURIComponent(cat.query)}&language=en&pageSize=1&apiKey=${process.env.NEWS_API_KEY}`
            );

            if (response.data.articles.length > 0) {
                const article = response.data.articles[0];
                diverseItems.push({
                    title: article.title,
                    description: article.description || "Professional IPR details available in source link.",
                    ipr_type: cat.type, 
                    domain: cat.domain, 
                    year: new Date(article.publishedAt).getFullYear() || 2026,
                    source: article.url
                });
            }
        }

        // 3. Append to database (Ordered: false skips duplicates)
        await Fact.insertMany(diverseItems, { ordered: false });
        
        res.status(200).json({ 
            message: `Success! Synced a diverse mix: ${diverseItems.map(item => item.ipr_type).join(', ')}` 
        });
    } catch (error) {
        if (error.code === 11000) return res.status(200).json({ message: "Diverse facts updated!" });
        res.status(500).json({ error: error.message });
    }
});

// 3. AUTHENTIC IPR SYNC (High-Value Multi-Domain Facts)
// 🟢 AUTHENTIC IPR SYNC (Picks 5 random from a library of 100)
// 🟢 AUTHENTIC IPR SYNC (Appends 5 random facts to history)
// 🟢 DIVERSE AUTHENTIC SYNC (Picks 1 random fact from each IPR Type)
router.post('/sync-authentic', async (req, res) => {
    try {
        const authenticMasterLibrary = [
            // PATENTS
            { title: "Google's Transformer Architecture", description: "The patented AI logic behind LLMs like GPT. Essential for understanding modern generative AI scaling.", ipr_type: "Patent", domain: "Artificial Intelligence", year: 2017 },
            { title: "CRISPR-Cas9 Gene Editing", description: "A revolutionary biotechnology patent allowing for precise DNA editing, sparking a major legal ownership battle.", ipr_type: "Patent", domain: "Healthcare", year: 2014 },

            // COPYRIGHTS
            { title: "NPCI UPI Common Library", description: "The core software code for UPI is copyrighted by NPCI, ensuring secure and standardized digital payments.", ipr_type: "Copyright", domain: "UPI & FinTech", year: 2016 },
            { title: "Mickey Mouse (Steamboat Willie)", description: "The landmark case for copyright extension; the original 1928 version finally entered the public domain in 2024.", ipr_type: "Copyright", domain: "Entertainment", year: 2024 },

            // TRADEMARKS
            { title: "The Nike 'Swoosh' Logo", description: "One of the world's most valuable trademarks, protecting the brand's visual identity across all global markets.", ipr_type: "Trademark", domain: "Fashion", year: 1971 },
            { title: "Apple's 'Think Different' Slogan", description: "A famous trademark that protects the brand's marketing identity and prevents competitors from using similar phrasing.", ipr_type: "Trademark", domain: "Technology", year: 1997 },

            // TRADE SECRETS
            { title: "Tesla Autopilot Neural Weights", description: "The proprietary data and model weights for Tesla's self-driving IoT sensors are guarded as high-value Trade Secrets.", ipr_type: "Trade Secret", domain: "Automobile", year: 2022 },
            { title: "Coca-Cola's Original Formula", description: "The most famous Trade Secret in history; never patented to avoid revealing the ingredients to the public.", ipr_type: "Trade Secret", domain: "Food & Beverage", year: 1886 },

            // INDUSTRIAL DESIGNS
            { title: "iPhone's Rounded Corner Design", description: "Apple holds industrial design rights for the specific aesthetic look and feel of the iPhone hardware.", ipr_type: "Industrial Design", domain: "Technology", year: 2007 },
            { title: "Dyson Bagless Vacuum Shape", description: "The unique external appearance and airflow housing are protected via Industrial Design rights.", ipr_type: "Industrial Design", domain: "Research & Discovery", year: 1983 },

            // PATENTS
{ title: "Intel x86 Microprocessor Architecture", description: "Intel patented the instruction set architecture that powers most personal computers worldwide.", ipr_type: "Patent", domain: "Technology", year: 1978 },
{ title: "ARM Processor Architecture Licensing", description: "ARM patented energy-efficient processor designs widely used in smartphones and IoT devices.", ipr_type: "Patent", domain: "Technology", year: 1990 },
{ title: "Wi-Fi IEEE 802.11 Wireless Protocol", description: "A collection of patented technologies enabling wireless networking across devices and routers.", ipr_type: "Patent", domain: "Technology", year: 1997 },
{ title: "Qualcomm CDMA Mobile Technology", description: "Patented mobile communication protocol that became foundational for cellular networks.", ipr_type: "Patent", domain: "Telecommunications", year: 1993 },
{ title: "Amazon 1-Click Checkout System", description: "Amazon patented its one-click purchasing system to simplify e-commerce transactions.", ipr_type: "Patent", domain: "E-Commerce", year: 1999 },
{ title: "Tesla Battery Thermal Management", description: "Tesla patented advanced systems to regulate temperature in electric vehicle battery packs.", ipr_type: "Patent", domain: "Automobile", year: 2014 },
{ title: "Toyota Hybrid Synergy Drive", description: "Toyota’s hybrid vehicle powertrain design is protected by several drivetrain patents.", ipr_type: "Patent", domain: "Automobile", year: 1997 },
{ title: "Bosch Anti-Lock Braking System", description: "ABS technology prevents wheel lock during braking and is protected by automotive patents.", ipr_type: "Patent", domain: "Automobile", year: 1978 },
{ title: "Google PageRank Search Algorithm", description: "Google patented the PageRank method used to rank web pages by importance.", ipr_type: "Patent", domain: "Technology", year: 1998 },
{ title: "NVIDIA CUDA Parallel Processing", description: "Patented GPU computing architecture allowing massive parallel computation for AI training.", ipr_type: "Patent", domain: "Artificial Intelligence", year: 2007 },

{ title: "IBM Hard Disk Storage Technology", description: "IBM patented early magnetic disk storage systems enabling modern digital data storage.", ipr_type: "Patent", domain: "Technology", year: 1956 },
{ title: "Sony Blu-ray Optical Disc Technology", description: "Blu-ray technology was protected by patents enabling high-definition video storage.", ipr_type: "Patent", domain: "Entertainment", year: 2005 },
{ title: "Dolby Atmos Spatial Audio", description: "Dolby patented immersive 3D sound technologies used in cinemas and streaming media.", ipr_type: "Patent", domain: "Entertainment", year: 2012 },
{ title: "SpaceX Reusable Rocket Landing", description: "Patented landing systems allow rockets to return safely for reuse after launch.", ipr_type: "Patent", domain: "Space Technology", year: 2015 },
{ title: "NASA Memory Foam Technology", description: "NASA patented viscoelastic foam material used in mattresses and medical cushions.", ipr_type: "Patent", domain: "Healthcare", year: 1966 },
{ title: "Garmin GPS Navigation Software", description: "Navigation algorithms and route calculation techniques are protected through patents.", ipr_type: "Patent", domain: "Technology", year: 1995 },
{ title: "Waymo Self-Driving Sensor Fusion", description: "Waymo patented algorithms that combine lidar, radar and camera data for autonomous driving.", ipr_type: "Patent", domain: "Automobile", year: 2018 },
{ title: "Philips Hue Smart Lighting Network", description: "Patented IoT lighting systems allowing remote control and synchronization of bulbs.", ipr_type: "Patent", domain: "IoT", year: 2012 },
{ title: "Apple Face Recognition Technology", description: "Apple patented facial authentication technology used in Face ID systems.", ipr_type: "Patent", domain: "Artificial Intelligence", year: 2017 },
{ title: "Google Tensor Processing Unit", description: "Custom AI chips patented by Google to accelerate deep learning workloads.", ipr_type: "Patent", domain: "Artificial Intelligence", year: 2016 },

// COPYRIGHTS
{ title: "Microsoft Windows Operating System Code", description: "The source code of the Windows operating system is protected under copyright law.", ipr_type: "Copyright", domain: "Technology", year: 1985 },
{ title: "Linux Kernel Open Source License", description: "Although open source, Linux kernel code is copyrighted under the GPL license.", ipr_type: "Copyright", domain: "Technology", year: 1991 },
{ title: "Adobe Photoshop Software", description: "The graphics editing software code and interface are protected under copyright.", ipr_type: "Copyright", domain: "Technology", year: 1990 },
{ title: "Unity Game Engine Codebase", description: "Unity’s rendering engine and development tools are protected by copyright law.", ipr_type: "Copyright", domain: "Entertainment", year: 2005 },
{ title: "Unreal Engine Rendering System", description: "Epic Games holds copyright protections over the Unreal Engine source code.", ipr_type: "Copyright", domain: "Entertainment", year: 1998 },
{ title: "YouTube Video Content Platform", description: "Videos uploaded to YouTube are protected under global copyright laws.", ipr_type: "Copyright", domain: "Entertainment", year: 2005 },
{ title: "Spotify Music Streaming Library", description: "Music streaming content is protected by copyright agreements with artists and labels.", ipr_type: "Copyright", domain: "Entertainment", year: 2008 },
{ title: "Wikipedia Knowledge Database", description: "Wikipedia articles are copyrighted but licensed under Creative Commons.", ipr_type: "Copyright", domain: "Education", year: 2001 },
{ title: "OpenAI GPT Research Papers", description: "The research documentation behind GPT models is protected by academic copyright.", ipr_type: "Copyright", domain: "Artificial Intelligence", year: 2018 },
{ title: "Coursera Online Course Content", description: "Educational video lectures and materials are protected under copyright law.", ipr_type: "Copyright", domain: "Education", year: 2012 },

// TRADEMARKS
{ title: "Google Brand Name", description: "Google’s name and colorful logo are registered trademarks for search and digital services.", ipr_type: "Trademark", domain: "Technology", year: 1997 },
{ title: "Ferrari Prancing Horse Logo", description: "Ferrari’s iconic prancing horse symbol is protected globally as a trademark.", ipr_type: "Trademark", domain: "Automobile", year: 1932 },
{ title: "Starbucks Mermaid Logo", description: "Starbucks protects its green mermaid logo as a registered trademark worldwide.", ipr_type: "Trademark", domain: "Business", year: 1971 },
{ title: "McDonald's Golden Arches", description: "The Golden Arches symbol represents McDonald's brand identity and is trademarked globally.", ipr_type: "Trademark", domain: "Food & Beverage", year: 1962 },
{ title: "Adidas Three Stripe Design", description: "Adidas trademarked the three-stripe pattern used across its footwear and apparel.", ipr_type: "Trademark", domain: "Fashion", year: 1949 },
{ title: "Twitter Bird Logo", description: "The Twitter bird icon is registered as a trademark for social media services.", ipr_type: "Trademark", domain: "Technology", year: 2010 },
{ title: "Amazon Smile Logo", description: "Amazon’s curved smile logo is a trademark representing its e-commerce brand.", ipr_type: "Trademark", domain: "E-Commerce", year: 2000 },
{ title: "Pepsi Globe Logo", description: "Pepsi protects its globe symbol as a trademark representing the beverage brand.", ipr_type: "Trademark", domain: "Food & Beverage", year: 1962 },
{ title: "Samsung Galaxy Brand", description: "Samsung trademarked the Galaxy name for its smartphone product line.", ipr_type: "Trademark", domain: "Technology", year: 2009 },
{ title: "PlayStation Gaming Brand", description: "Sony’s PlayStation name and symbol are protected as trademarks worldwide.", ipr_type: "Trademark", domain: "Entertainment", year: 1994 },

// TRADE SECRETS
{ title: "Google Search Ranking Signals", description: "The exact algorithm used to rank web pages is protected as a confidential trade secret.", ipr_type: "Trade Secret", domain: "Technology", year: 2000 },
{ title: "KFC 11 Herbs and Spices Recipe", description: "The famous fried chicken seasoning blend is guarded as a company trade secret.", ipr_type: "Trade Secret", domain: "Food & Beverage", year: 1940 },
{ title: "McDonald's Big Mac Sauce Recipe", description: "The sauce formula used in the Big Mac burger is kept confidential as a trade secret.", ipr_type: "Trade Secret", domain: "Food & Beverage", year: 1967 },
{ title: "Apple Product Launch Strategy", description: "Apple’s strict secrecy around upcoming devices is protected through trade secrets.", ipr_type: "Trade Secret", domain: "Technology", year: 2000 },
{ title: "Google Data Center Optimization", description: "Energy efficiency and cooling techniques used in Google data centers remain proprietary secrets.", ipr_type: "Trade Secret", domain: "Cloud Computing", year: 2015 },
{ title: "Meta Social Media Ranking Algorithms", description: "Facebook and Instagram ranking models are guarded internally as trade secrets.", ipr_type: "Trade Secret", domain: "Artificial Intelligence", year: 2021 },
{ title: "Netflix Content Recommendation Model", description: "Netflix protects the logic behind its recommendation engine as proprietary data science trade secrets.", ipr_type: "Trade Secret", domain: "Artificial Intelligence", year: 2013 },
{ title: "Tesla Battery Manufacturing Process", description: "Tesla protects specific manufacturing processes used in Gigafactories as trade secrets.", ipr_type: "Trade Secret", domain: "Automobile", year: 2021 },
{ title: "Adobe Creative Cloud Rendering Pipeline", description: "Internal rendering techniques used by Adobe tools remain protected as trade secrets.", ipr_type: "Trade Secret", domain: "Technology", year: 2018 },
{ title: "OpenAI Training Data Mixtures", description: "The exact datasets used to train large language models are guarded as trade secrets.", ipr_type: "Trade Secret", domain: "Artificial Intelligence", year: 2023 },

// INDUSTRIAL DESIGNS
{ title: "MacBook Aluminum Unibody Design", description: "Apple protects the minimalist aluminum laptop body through industrial design rights.", ipr_type: "Industrial Design", domain: "Technology", year: 2008 },
{ title: "Tesla Model S Body Shape", description: "Tesla protects the aerodynamic design appearance of the Model S vehicle.", ipr_type: "Industrial Design", domain: "Automobile", year: 2012 },
{ title: "Dyson Air Multiplier Fan", description: "The bladeless fan appearance is protected under industrial design protection.", ipr_type: "Industrial Design", domain: "Technology", year: 2009 },
{ title: "Sony PlayStation Controller Shape", description: "Sony protects the physical ergonomic design of the PlayStation controller.", ipr_type: "Industrial Design", domain: "Entertainment", year: 1994 },
{ title: "Apple AirPods Charging Case", description: "The distinctive case design for wireless earbuds is protected under industrial design rights.", ipr_type: "Industrial Design", domain: "Technology", year: 2016 },
{ title: "GoPro Action Camera Body", description: "The compact rugged design of GoPro cameras is protected through design rights.", ipr_type: "Industrial Design", domain: "Technology", year: 2014 },
{ title: "Bang & Olufsen Speaker Design", description: "The distinctive geometric speaker appearance is protected by industrial design law.", ipr_type: "Industrial Design", domain: "Entertainment", year: 2010 },
{ title: "Dyson Supersonic Hair Dryer Shape", description: "The futuristic circular motor housing design is protected as industrial design.", ipr_type: "Industrial Design", domain: "Fashion", year: 2016 },
{ title: "Apple Watch Interface Layout", description: "The grid layout of app icons in Apple Watch is protected under design rights.", ipr_type: "Industrial Design", domain: "Technology", year: 2015 },
{ title: "Tesla Cybertruck Exterior Geometry", description: "The angular stainless steel body design is protected under industrial design protection.", ipr_type: "Industrial Design", domain: "Automobile", year: 2019 }
        ];

        // 🟢 LOGIC: Group by Type and pick one random from each group
        const types = ['Patent', 'Copyright', 'Trademark', 'Trade Secret', 'Industrial Design'];
        let diverseSelection = [];

        types.forEach(type => {
            const filteredByType = authenticMasterLibrary.filter(item => item.ipr_type === type);
            if (filteredByType.length > 0) {
                const randomFromType = filteredByType[Math.floor(Math.random() * filteredByType.length)];
                diverseSelection.push(randomFromType);
            }
        });

        // Append to database (Ordered: false skips any internal duplicates)
        await Fact.insertMany(diverseSelection, { ordered: false });
        
        res.status(200).json({ 
            message: `Authentic Diversity Sync Successful: Added ${diverseSelection.length} different IPR types!` 
        });
    } catch (error) {
        if (error.code === 11000) return res.status(200).json({ message: "Authentic records updated!" });
        res.status(500).json({ error: error.message });
    }
});
// 4. RESET / SEED
router.post('/seed', async (req, res) => {
  try {
    await Fact.deleteMany({});
    res.json({ message: "Database Cleared!" }); 
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;