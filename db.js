import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

// laad variabelen uit .env voordat alles anders gebruikt wordt
dotenv.config();

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const collectionName = process.env.MONGODB_COLLECTION || 'recipes';

let dbClient;
let collection;

// Verbind met MongoDB en geef de recepten-collectie terug
export async function connectMongo() {
  if (collection) return collection;
  dbClient = new MongoClient(mongoUri);
  await dbClient.connect();
  const database = dbClient.db(dbName);
  collection = database.collection(collectionName);
  return collection;
}

// Haal alle documenten uit de collectie op en sorteer op naam
export async function getAll() {
  const coll = await connectMongo();
  return coll.find({}).sort({ name: 1 }).toArray();
}

// Zoek een document op basis van de _id
export async function getById(id) {
  const coll = await connectMongo();
  return coll.findOne({ _id: new ObjectId(id) });
}

// Voeg een nieuw document toe aan de collectie
export async function insert(doc) {
  const coll = await connectMongo();
  return coll.insertOne(doc);
}

// Werk een bestaand document bij en geef de bijgewerkte versie terug
export async function update(id, updateDoc) {
  const coll = await connectMongo();
  return coll.findOneAndUpdate({ _id: new ObjectId(id) }, updateDoc, { returnDocument: 'after' });
}

// Verwijder een document op basis van de _id
export async function remove(id) {
  const coll = await connectMongo();
  return coll.deleteOne({ _id: new ObjectId(id) });
}

// Sluit de databaseverbinding en reset interne status
export async function close() {
  if (dbClient) await dbClient.close();
  dbClient = null;
  collection = null;
}

export { ObjectId };
