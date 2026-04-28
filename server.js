const path = require("path");
const express = require("express");
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bookstore_db";
const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_env";

app.use(cors());
app.use(express.json());

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

const cartItemSchema = new mongoose.Schema(
  {
    bookId: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [cartItemSchema], default: [] }
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

const Book = mongoose.model("Book", bookSchema);
const Cart = mongoose.model("Cart", cartSchema);
const User = mongoose.model("User", userSchema);

function authOwner(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "owner") {
      return res.status(403).json({ message: "Only owner can access this endpoint" });
    }
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function authUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "user") {
      return res.status(403).json({ message: "Only users can access this endpoint" });
    }
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

async function seedDefaultBooks() {
  const count = await Book.countDocuments();
  if (count > 0) {
    return;
  }

  await Book.insertMany([
    { title: "The Midnight Library", author: "Matt Haig", price: 12.99, description: "A thought-provoking novel about second chances." },
    { title: "Atomic Habits", author: "James Clear", price: 10.49, description: "Build good habits with practical systems." },
    { title: "The Alchemist", author: "Paulo Coelho", price: 9.95, description: "A timeless journey of purpose and dreams." },
    { title: "Dune", author: "Frank Herbert", price: 14.25, description: "Classic science fiction epic." }
  ]);
}

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: "User already exists with this email" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash
  });

  const token = jwt.sign({ userId: user._id.toString(), email: user.email, role: "user" }, JWT_SECRET, { expiresIn: "8h" });
  return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: user._id.toString(), email: user.email, role: "user" }, JWT_SECRET, { expiresIn: "8h" });
  return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

app.get("/api/auth/me", authUser, async (req, res) => {
  const user = await User.findById(req.user.userId).select("name email");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({ user: { id: user._id, name: user.name, email: user.email } });
});

app.get("/api/books", async (req, res) => {
  const books = await Book.find().sort({ createdAt: -1 });
  return res.json(books);
});

app.post("/api/books", authOwner, async (req, res) => {
  const { title, author, price, description } = req.body;

  if (!title || !author || price === undefined) {
    return res.status(400).json({ message: "Title, author, and price are required" });
  }

  const parsedPrice = Number(price);
  if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ message: "Price must be a valid non-negative number" });
  }

  const created = await Book.create({
    title: title.trim(),
    author: author.trim(),
    price: parsedPrice,
    description: description ? String(description).trim() : ""
  });

  return res.status(201).json(created);
});

app.get("/api/cart", authUser, async (req, res) => {
  const userId = req.user.userId;
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    return res.json({ items: [], total: 0 });
  }

  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return res.json({ items: cart.items, total });
});

app.post("/api/cart/items", authUser, async (req, res) => {
  const userId = req.user.userId;
  const { bookId, quantity = 1 } = req.body;

  if (!bookId) {
    return res.status(400).json({ message: "bookId is required" });
  }

  const qty = Number(quantity);
  if (Number.isNaN(qty) || qty < 1) {
    return res.status(400).json({ message: "Quantity must be at least 1" });
  }

  const book = await Book.findById(bookId);
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  const existingItem = cart.items.find((item) => item.bookId.toString() === book._id.toString());
  if (existingItem) {
    existingItem.quantity += qty;
  } else {
    cart.items.push({
      bookId: book._id,
      title: book.title,
      price: book.price,
      quantity: qty
    });
  }

  await cart.save();

  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return res.status(201).json({ items: cart.items, total });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.use(express.static(path.join(__dirname)));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    await seedDefaultBooks();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect MongoDB:", error.message);
    process.exit(1);
  });