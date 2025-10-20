import express from "express";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const app = express();
app.use(cors());
dotenv.config();
app.use(bodyParser.json());

const adapter = new JSONFile("db.json");
const db = new Low(adapter, { strings: [] });
await db.read();

function analyzerString(value) {
  const cleaned = value.toLowerCase();
  const reserved = cleaned.split(" ").reverse().join();
  const is_palindrome = cleaned === reserved;
  const unique_characters = new Set(cleaned.replace(/\s/g, "")).size;
  const word_count = value.trim().split(/\s+/).filter(Boolean).length;
  const sha256_hash = crypto.createHash("sha256").update(value).digest("hex");

  const character_frequency_map = {};
  for (let char of cleaned.replace(/\s/g, "")) {
    character_frequency_map[char] = (character_frequency_map[char] || 0) + 1;
  }

  return {
    length: value.length,
    is_palindrome,
    unique_characters,
    word_count,
    sha256_hash,
    character_frequency_map,
  };
}

app.post("/strings", async (req, res) => {
  const { value } = req.body;
  if (typeof value !== "string") {
    return res.status(422).json({ error: "Value must be a string" });
  }
  if (!value.trim()) {
    return res.status(400).json({ error: "Missing or empty 'value'" });
  }

  const hash = crypto.createHash("sha256").update(value).digest("hex");
  const existing = db.data.strings.find((s) => s.id === hash);
  if (existing) {
    return res.status(409).json({ error: "String already exists" });
  }

  const properties = analyzerString(value);
  const newString = {
    id: properties.sha256_hash,
    value,
    properties,
    created_at: new Date().toISOString(),
  };
  db.data.strings.push(newString);
  await db.write();
  res.status(201).json(newString);
});

app.get("/strings/:value", async (req, res) => {
  const value = req.params.value;
  const hash = crypto.createHash("sha256").update(value).digest("hex");
  const found = db.data.strings.find((s) => s.id === hash);

  if (!found) {
    return res.status(404).json({ error: "String not found" });
  }
  res.json(found);
});

app.get("/strings", async (req, res) => {
  let results = db.data.strings;
  const {
    is_palindrome,
    min_length,
    max_length,
    word_count,
    contains_character,
  } = req.query;

  if (is_palindrome) {
    results = results.filter(
      (s) => s.properties.is_palindrome === (is_palindrome === "true")
    );
  }
  if (min_length) {
    results = results.filter(
      (s) => s.properties.length >= parseInt(min_length)
    );
  }
  if (max_length) {
    results = results.filter(
      (s) => s.properties.length <= parseInt(max_length)
    );
  }
  if (word_count) {
    results = results.filter(
      (s) => s.properties.word_count === parseInt(word_count)
    );
  }
  if (contains_character) {
    results = results.filter((s) =>
      s.value.toLowerCase().includes(contains_character.toLowerCase)
    );
  }
  res.json({
    data: results,
    count: results.length,
    filter_applied: req.query,
  });
});

app.delete("strings/:value", async (req, res) => {
  const value = req.params.value;
  const hash = crypto.createHash("sha256").update(value).digest("hex");

  const index = db.data.strings.findIndex((s) => s.id === hash);
  if (index === -1) {
    return res.status(404).json({ error: "String not found" });
  }
  db.data.strings.splice(index, 1);
  await db.write();
  res.status(204).send();
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
