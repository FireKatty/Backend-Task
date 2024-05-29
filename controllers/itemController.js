const pool = require('../db.js');

exports.getItems = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items');
    res.json(result.rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getItemById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createItem = async (req, res) => {
  const { name, description, starting_price, end_time, image_url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO items (name, description, starting_price, end_time, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, starting_price, end_time, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateItem = async (req, res) => {
  const { id } = req.params;
  const { name, description, starting_price, end_time, image_url } = req.body;
  try {
    const result = await pool.query(
      'UPDATE items SET name = $1, description = $2, starting_price = $3, end_time = $4, image_url = $5 WHERE id = $6 RETURNING *',
      [name, description, starting_price, end_time, image_url, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteItem = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  }catch (error){
    res.status(400).json({error: error.message})
  }

}