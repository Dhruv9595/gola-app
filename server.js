require("dotenv").config();

const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));

// 🔐 Admin password
const ADMIN_PASSWORD = "1234";

// 🤖 Telegram
const TOKEN = process.env.TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// ==============================
// 📋 MENU FUNCTIONS
// ==============================
function getMenu() {
  return JSON.parse(fs.readFileSync("menu.json")).items;
}

function saveMenu(menu) {
  fs.writeFileSync("menu.json", JSON.stringify({ items: menu }, null, 2));
}

// ==============================
// 📦 ORDER FUNCTIONS
// ==============================
function getOrders() {
  try {
    return JSON.parse(fs.readFileSync("orders.json"));
  } catch {
    return [];
  }
}

function saveOrders(data) {
  fs.writeFileSync("orders.json", JSON.stringify(data, null, 2));
}

// ==============================
// 📩 TELEGRAM FUNCTION
// ==============================
async function sendMessage(text) {
  try {
    await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text,
    });
    console.log("📩 Telegram sent");
  } catch (err) {
    console.log("❌ Telegram error:", err.response?.data || err.message);
  }
}

// ==============================
// 📋 API: GET MENU
// ==============================
app.get("/menu", (req, res) => {
  res.json(getMenu());
});

// ==============================
// 🛒 API: ORDER (FAST VERSION)
// ==============================
app.post("/order", async (req, res) => {
  try {
    const { name, orders } = req.body;

    if (!name || !orders || orders.length === 0) {
      return res.send("Invalid order");
    }

    const menu = getMenu();
    let total = 0;
    let itemsText = "";

    for (let o of orders) {
      const item = menu.find(i => i.name === o.flavor);
      if (!item) continue;

      const itemTotal = item.price * o.quantity;
      total += itemTotal;

      itemsText += `🍧 ${o.flavor} x ${o.quantity} = ₹${itemTotal}\n`;
    }

    const allOrders = getOrders();
    const orderId = allOrders.length + 1;
    const time = new Date().toLocaleString();

    const message = `
📦 Order #${orderId}

👤 ${name}

${itemsText}
💰 Total: ₹${total}

🕒 ${time}
`;

    // 💾 Save order FIRST
    const newOrder = {
      id: orderId,
      name,
      orders,
      total,
      time,
    };

    allOrders.push(newOrder);
    saveOrders(allOrders);

    // ✅ SEND RESPONSE IMMEDIATELY (NO LAG)
    res.send("✅ Order placed successfully!");

    // 📩 SEND TELEGRAM IN BACKGROUND
    sendMessage(message);

  } catch (error) {
    console.log("❌ Order error:", error.message);
    res.send("❌ Something went wrong");
  }
});

// ==============================
// 🔒 UPDATE MENU
// ==============================
app.post("/update-menu", (req, res) => {
  const { password, menu } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).send("Wrong password");
  }

  saveMenu(menu);
  res.send("Menu updated");
});

// ==============================
// 🚀 START SERVER
// ==============================
app.listen(5000, () => {
  console.log("🚀 Server running on 5000");
});