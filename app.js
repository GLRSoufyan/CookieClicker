import dotenv from 'dotenv';
import express from 'express';
import * as db from './db.js';

// laad variabelen uit .env voordat alles anders gebruikt wordt
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Haal alle recepten op
app.get('/api/recipes', async (req, res) => {
  try {
    const docs = await db.getAll();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Haal één recept op via id
app.get('/api/recipes/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await db.getById(id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: 'Invalid id or request' });
  }
});

// Maak een nieuw recept aan
app.post('/api/recipes', async (req, res) => {
  try {
    const body = req.body;
    const recipe = {
      name: body.name || 'unnamed',
      ingredients: Array.isArray(body.ingredients)
        ? body.ingredients
        : (body.ingredients || '').split(',').map(s => s.trim()).filter(Boolean),
      prepTimeInMinutes: Number(body.prepTimeInMinutes) || 0,
    };
    const result = await db.insert(recipe);
    res.status(201).json({ _id: result.insertedId, ...recipe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Werk een bestaand recept bij
app.put('/api/recipes/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;
    const update = {
      $set: {
        name: body.name,
        ingredients: Array.isArray(body.ingredients)
          ? body.ingredients
          : (body.ingredients || '').split(',').map(s => s.trim()).filter(Boolean),
        prepTimeInMinutes: Number(body.prepTimeInMinutes) || 0,
      }
    };
    const result = await db.update(id, update);
    if (!result.value) return res.status(404).json({ error: 'Not found' });
    res.json(result.value);
  } catch (err) {
    res.status(400).json({ error: 'Invalid id or request' });
  }
});

// Verwijder een recept
app.delete('/api/recipes/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await db.remove(id);
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(400).json({ error: 'Invalid id or request' });
  }
});

// Start de server en maak verbinding met de database
app.listen(PORT, async () => {
  try {
    await db.connectMongo();
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
  }
});

// Behandel SIGINT voor nette afsluiting
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await db.close();
  process.exit(0);
});
