const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));

// 🔐 password for admin
const ADMIN_PASSWORD = "1234";

// 🤖 Telegram (replace later)
const TOKEN = process.env.TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// 📋 get menu
function getMenu() {
  return JSON.parse(fs.readFileSync("menu.json")).items;
}

// 💾 save menu
function saveMenu(menu) {
  fs.writeFileSync("menu.json", JSON.stringify({ items: menu }, null, 2));
}

// 📩 send message
async function sendMessage(text) {
  await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    chat_id: CHAT_ID,
    text
  });
}

// 📋 API: get menu
app.get("/menu", (req, res) => {
  res.json(getMenu());
});

// 🛒 API: order
app.post("/order", async (req, res) => {
  const { name, flavor, quantity } = req.body;

  const menu = getMenu();
  const item = menu.find(i => i.name === flavor);

  if (!item) return res.send("Invalid flavor");

  const total = item.price * quantity;

  const msg = `📦 New Order

👤 ${name}
🍧 ${flavor}
🔢 Qty: ${quantity}
💰 ₹${total}`;

  await sendMessage(msg);

  res.send("Order sent!");
});

// 🔒 API: update menu
app.post("/update-menu", (req, res) => {
  const { password, menu } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).send("Wrong password");
  }

  saveMenu(menu);
  res.send("Menu updated");
});

app.listen(5000, () => console.log("Server running on 5000"));