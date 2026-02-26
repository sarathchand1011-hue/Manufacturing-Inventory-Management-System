
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/inventory', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"));

const ItemSchema = new mongoose.Schema({
    itemName: String,
    category: String,
    quantity: Number,
    unitPrice: Number,
    threshold: Number,
    supplier: String,
    lastUpdated: { type: Date, default: Date.now }
});

const Item = mongoose.model("Item", ItemSchema);

// GET all items
app.get('/api/items', async (req, res) => {
    const items = await Item.find();
    res.json(items);
});

// POST add item
app.post('/api/items', async (req, res) => {
    const item = new Item(req.body);
    await item.save();
    res.json(item);
});

// PUT update item
app.put('/api/items/:id', async (req, res) => {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
});

// DELETE item
app.delete('/api/items/:id', async (req, res) => {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted Successfully" });
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
