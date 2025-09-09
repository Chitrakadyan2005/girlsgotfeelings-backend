const pool = require('../config/db');

// Add a new suggestion (only logged-in users)
exports.addSuggestion = async (req, res) => {
  try {
    const { suggestion } = req.body;
    if (!suggestion) return res.status(400).json({ message: 'Suggestion cannot be empty' });

    const userId = req.user.id; // <-- comes from JWT

    const result = await pool.query(
      'INSERT INTO suggestions (user_id, text) VALUES ($1, $2) RETURNING *',
      [userId, suggestion]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all suggestions (open to all logged-in users)
exports.getSuggestions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.username 
       FROM suggestions s
       JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update poll votes (only logged-in users)
exports.voteSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { vote } = req.body;

    if (!['yes', 'no'].includes(vote)) {
      return res.status(400).json({ message: 'Vote must be "yes" or "no"' });
    }

    const column = vote === 'yes' ? 'yes_count' : 'no_count';

    const result = await pool.query(
      `UPDATE suggestions 
       SET ${column} = ${column} + 1 
       WHERE id = $1 
       RETURNING *`,
      [parseInt(id)]   // ✅ make sure it's integer
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    res.json(result.rows[0]); // ✅ send back updated suggestion
  } catch (err) {
    console.error("Error voting:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
