const Search = require('../models/Search');

exports.searchContent = async(req,res) => {
    try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const posts = await Search.searchPosts(query);
    const users = await Search.searchUsers(query);

    res.status(200).json({ posts, users });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};