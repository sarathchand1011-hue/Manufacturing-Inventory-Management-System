// Import required packages
const express = require('express');     // Backend framework
const mongoose = require('mongoose');   // MongoDB connection
const cors = require('cors');           // Allow frontend requests

const app = express();

// Middleware
app.use(cors());            // Enable Cross-Origin Resource Sharing
app.use(express.json());    // Parse JSON request body


/* ==============================
   MongoDB Connection
================================ */
mongoose.connect('mongodb://127.0.0.1:27017/inventory', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"));


/* ==============================
   ITEM SCHEMA (Inventory Items)
================================ */
const ItemSchema = new mongoose.Schema({

    itemName: {
        type: String,
        required: true          // Item name mandatory
    },

    category: String,           // Item category

    quantity: {
        type: Number,
        required: true          // Available stock
    },

    unitPrice: {
        type: Number,
        required: true          // Price per item
    },

    threshold: {
        type: Number,
        default: 5              // Low stock alert level
    },

    supplier: String,           // Supplier name

    lastUpdated: {
        type: Date,
        default: Date.now       // Auto timestamp
    }
});

// Create Item Model
const Item = mongoose.model("Item", ItemSchema);


/* ==============================
   BILL SCHEMA (Invoice)
================================ */
const BillSchema = new mongoose.Schema({

    invoiceNumber: String,      // Generated invoice number

    items: [
        {
            itemName: String,
            quantity: Number,
            price: Number,
            total: Number
        }
    ],

    grandTotal: Number,         // Total bill amount
    paidAmount: Number,         // Paid value

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create Bill Model
const Bill = mongoose.model("Bill", BillSchema);


/* ==============================
   ITEM APIs (CRUD Operations)
================================ */

// GET → Fetch all inventory items
app.get('/api/items', async (req, res) => {
    const items = await Item.find();
    res.json(items);
});

// POST → Add new item
app.post('/api/items', async (req, res) => {
    const item = new Item(req.body);
    await item.save();
    res.json(item);
});

// PUT → Update item details
app.put('/api/items/:id', async (req, res) => {
    const item = await Item.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );
    res.json(item);
});

// DELETE → Remove item
app.delete('/api/items/:id', async (req, res) => {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted Successfully" });
});


/* ==============================
   BILL GENERATION API
================================ */
app.post("/api/bill", async (req, res) => {

    const billItems = req.body.items;
    let grandTotal = 0;

    // Loop through purchased items
    for (let b of billItems) {

        // Find item in inventory
        const item = await Item.findById(b.itemId);

        if (!item)
            return res.status(404).json({message:"Item not found"});

        // Stock validation
        if (item.quantity < b.quantity)
            return res.status(400).json({
                message:`${item.itemName} Out of Stock`
            });

        // Reduce stock quantity
        item.quantity -= b.quantity;
        await item.save();

        // Calculate item total
        b.total = b.quantity * b.price;
        grandTotal += b.total;
    }

    // Generate invoice number
    const invoice =
    "INV-" + Math.floor(1000 + Math.random()*9000);

    // Create bill document
    const bill = new Bill({
        invoiceNumber:invoice,
        items:billItems,
        grandTotal,
        paidAmount:grandTotal
    });

    await bill.save();

    res.json(bill);
});


/* ==============================
   PDF BILL GENERATION
================================ */
const PDFDocument = require("pdfkit");

// Download bill as PDF
app.get("/api/bill/:id/pdf", async (req,res)=>{

const bill = await Bill.findById(req.params.id);

// Create PDF document
const doc = new PDFDocument({ margin:40 });

// Response headers
res.setHeader(
"Content-Disposition",
"attachment; filename=receipt.pdf"
);
res.setHeader("Content-Type","application/pdf");

// Pipe PDF to response
doc.pipe(res);


/* ---------- HEADER ---------- */
doc
.fontSize(20)
.text("SMART INVENTORY STORE",{align:"center"});

doc.moveDown(0.5);

doc
.fontSize(10)
.text(`Invoice No : ${bill.invoiceNumber}`)
.text(`Date : ${new Date(bill.createdAt)
.toLocaleString()}`);

doc.moveDown();


/* ---------- TABLE HEADER ---------- */
doc.fontSize(12);

doc.text("Item",50);
doc.text("Qty",250);
doc.text("Price",300);
doc.text("Total",400);

doc.moveTo(50,150)
.lineTo(550,150)
.stroke();

let y=170;


/* ---------- BILL ITEMS ---------- */
bill.items.forEach(item=>{

doc.text(item.itemName,50,y);
doc.text(item.quantity,250,y);
doc.text(`₹${item.price}`,300,y);
doc.text(`₹${item.total}`,400,y);

y+=25;
});


/* ---------- TOTAL SECTION ---------- */
doc.moveTo(50,y)
.lineTo(550,y)
.stroke();

y+=20;

doc
.fontSize(14)
.text(`Grand Total : ₹${bill.grandTotal}`,350,y);

y+=25;

doc.text(`Paid Amount : ₹${bill.paidAmount}`,350,y);


/* ---------- FOOTER ---------- */
doc.moveDown(3);

doc
.fontSize(12)
.text("Thank You! Visit Again",{align:"center"});

// End PDF
doc.end();
});


/* ==============================
   SERVER START
================================ */
app.listen(5000, () =>
console.log("Server running on http://localhost:5000")
);
