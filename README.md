
# Manufacturing Inventory Management System

## Requirements
- Node.js installed
- MongoDB installed and running

## Setup Instructions

### Step 1: Start MongoDB
Make sure MongoDB service is running locally.

### Step 2: Start Backend
Open terminal:

cd inventory-service
npm install
npm start

Server runs on:
http://localhost:5000

### Step 3: Run Frontend
Open:
frontend/index.html
in your browser.

## API Endpoints
GET    /api/items
POST   /api/items
PUT    /api/items/:id
DELETE /api/items/:id

## Sample JSON to Add Item
{
  "itemName": "Steel Rod",
  "category": "Raw Material",
  "quantity": 100,
  "unitPrice": 50,
  "threshold": 20,
  "supplier": "ABC Suppliers"
}
