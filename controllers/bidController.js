// const db = require('../db.js');
// const io = require('../server').io;

// exports.placeBid = (req, res) => {
//   const { item_id, bid_amount } = req.body;
//   const user_id = req.userId;

//   // Check if the bid is higher than the current price
//   const checkQuery = 'SELECT current_price FROM items WHERE id = ?';
//   db.query(checkQuery, [item_id], (err, results) => {
//     if (err) return res.status(500).send('Error placing bid');
//     if (results.length === 0) return res.status(404).send('Item not found');

//     const currentPrice = results[0].current_price;
//     if (bid_amount <= currentPrice) {
//       return res.status(400).send('Bid amount must be higher than the current price');
//     }

//     // Place the bid
//     const bidQuery = 'INSERT INTO bids (item_id, user_id, bid_amount) VALUES (?, ?, ?)';
//     db.query(bidQuery, [item_id, user_id, bid_amount], (err, result) => {
//       if (err) return res.status(500).send('Error placing bid');

//       // Update the item's current price
//       const updateQuery = 'UPDATE items SET current_price = ? WHERE id = ?';
//       db.query(updateQuery, [bid_amount, item_id], (err, result) => {
//         if (err) return res.status(500).send('Error updating item price');

//         // Emit bid placed event
//         io.emit('bidPlaced', { item_id, user_id, bid_amount });

//         res.status(201).send('Bid placed successfully');
//       });
//     });
//   });
// };

// exports.getBidsByItem = (req, res) => {
//   const item_id = req.params.item_id;

//   const query = 'SELECT * FROM bids WHERE item_id = ? ORDER BY created_at DESC';
//   db.query(query, [item_id], (err, results) => {
//     if (err) return res.status(500).send('Error retrieving bids');
//     res.status(200).send(results);
//   });
// };

// exports.getUserBids = (req, res) => {
//   const user_id = req.userId;

//   const query = 'SELECT * FROM bids WHERE user_id = ? ORDER BY created_at DESC';
//   db.query(query, [user_id], (err, results) => {
//     if (err) return res.status(500).send('Error retrieving user bids');
//     res.status(200).send(results);
//   });
// };

const db = require('../db');
const io = require('../server').io;

// Helper function to create notifications
const createNotification = (userId, message) => {
  const query = 'INSERT INTO notifications (user_id, message) VALUES (?, ?)';
  db.query(query, [userId, message], (err, result) => {
    if (err) console.error('Error creating notification:', err);
  });
};

exports.placeBid = (req, res) => {
  const { item_id, bid_amount } = req.body;
  const user_id = req.userId;

  // Check if the bid is higher than the current price
  const checkQuery = 'SELECT current_price, user_id AS item_owner FROM items WHERE id = ?';
  db.query(checkQuery, [item_id], (err, results) => {
    if (err) return res.status(500).send('Error placing bid');
    if (results.length === 0) return res.status(404).send('Item not found');

    const currentPrice = results[0].current_price;
    const itemOwner = results[0].item_owner;
    if (bid_amount <= currentPrice) {
      return res.status(400).send('Bid amount must be higher than the current price');
    }

    // Place the bid
    const bidQuery = 'INSERT INTO bids (item_id, user_id, bid_amount) VALUES (?, ?, ?)';
    db.query(bidQuery, [item_id, user_id, bid_amount], (err, result) => {
      if (err) return res.status(500).send('Error placing bid');

      // Update the item's current price
      const updateQuery = 'UPDATE items SET current_price = ? WHERE id = ?';
      db.query(updateQuery, [bid_amount, item_id], (err, result) => {
        if (err) return res.status(500).send('Error updating item price');

        // Create notification for the item owner
        const ownerMessage = `A new bid of ${bid_amount} has been placed on your item.`;
        createNotification(itemOwner, ownerMessage);

        // Notify other bidders that they have been outbid
        const outbidMessage = `You have been outbid on item ${item_id}.`;
        const outbidQuery = 'SELECT DISTINCT user_id FROM bids WHERE item_id = ? AND user_id != ?';
        db.query(outbidQuery, [item_id, user_id], (err, results) => {
          if (err) console.error('Error notifying other bidders:', err);

          results.forEach(bidder => {
            createNotification(bidder.user_id, outbidMessage);
          });
        });

        // Emit bid placed event
        io.emit('bidPlaced', { item_id, user_id, bid_amount });

        res.status(201).send('Bid placed successfully');
      });
    });
  });
};
