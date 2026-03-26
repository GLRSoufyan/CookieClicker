# Project instructies

1. **Installatie van afhankelijkheden**

   Open een terminal in de projectmap en voer uit:
   ```bash
   npm install
   ```

2. **Configuratie**

   Gebruik een `.env` bestand om je variabelen te beheren. Maak een bestand
   `.env` in de projectroot met bijvoorbeeld:
   ```env
   PORT=3000
   MONGODB_URI="your connection string here"
   ```

   Je moet hier jouw eigen connection string inzetten anders werkt het niet!

   De code laadt deze variabelen via de `dotenv`-module, dus je hoeft niks
   in de broncode te wijzigen. Je kunt ook systeem‑omgevingsvariabelen
   gebruiken in plaats van een `.env` bestand.

3. **Het project uitvoeren**

   Start de server met:
   ```bash
   npm start
   # of: node app.js
   ```

4. **Project openen**

   Open je browser en ga naar `http://localhost:3000` of bekijk de
   code in je favoriete editor om aanpassingen te maken.
