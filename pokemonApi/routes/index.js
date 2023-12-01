var express = require('express');
const mysql = require('mysql');
const axios = require('axios');
var router = express.Router();

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'pokemon_api'
});

router.get('/capturar', async function(req, res, next) {
  try {

    const randomPokemonId = Math.floor(Math.random() * 100) + 1;
    
    const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${randomPokemonId}`;
  

    const response = await axios.get(pokemonUrl);
    const pokemonData = response.data;


    const { abilities, base_experience, id, name, sprites } = pokemonData;
    const { other } = sprites;
    const tmp_dream_world = other.dream_world
    const url = tmp_dream_world.front_default

    const sortedAbilities = abilities.map((ability, index) => ({
      sequencial: index + 1,
      nome: ability.ability.name,
      slot: ability.slot
    }));

    const checkIfExistsQuery = 'SELECT * FROM pokemon_captured WHERE id_pokemon = ?';
    db.query(checkIfExistsQuery, [randomPokemonId], (err, result) => {
      if (err) throw err;

      if (result.length > 0) {

        res.json({ message: 'Pokémon já capturado anteriormente.' });
      } else {

        const sql = `
        INSERT INTO pokemon_captured (id_pokemon, name, base_experience, abilities, url)
        VALUES (?, ?, ?, ?, ?)`;

        db.query(sql, [id, name, base_experience, JSON.stringify(sortedAbilities), url], (err, result) => {
          if (err) throw err;
          
          console.log(`Pokémon com ID ${id} capturado e salvo no banco de dados.`);
          res.json(pokemonData);
        });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao capturar o Pokémon' });
  }
});

router.get('/capturar/:id', async function(req, res, next) {
  try {
    const pokemonId = req.params.id;
    const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${pokemonId}`;
    const response = await axios.get(pokemonUrl);
    
    const checkIfExistsQuery = 'SELECT * FROM pokemon_captured WHERE id_pokemon = ?';
    db.query(checkIfExistsQuery, [pokemonId], (err, result) => {
      if (err) throw err;

      if (result.length > 0) {

        res.json({ message: 'Pokémon já está na Pokédex.' });
      } else {

        const pokemonData = response.data;

        const { abilities, base_experience, id, name, sprites } = pokemonData;
        const { other } = sprites;
        const tmp_dream_world = other.dream_world
        const url = tmp_dream_world.front_default

        const sortedAbilities = abilities.map((ability, index) => ({
          sequencial: index + 1,
          nome: ability.ability.name,
          slot: ability.slot
        }));

        const sql = `
        INSERT INTO pokemon_captured (id_pokemon, name, base_experience, abilities, url)
        VALUES (?, ?, ?, ?, ?)
      `;

        db.query(sql, [id, name, base_experience, JSON.stringify(sortedAbilities), url], (err, result) => {
          if (err) throw err;
          
          console.log(`Pokémon com ID ${id} capturado e salvo no banco de dados.`);
          res.json(pokemonData);
        });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao capturar o Pokémon' });
  }
});

router.get('/batalhar/:id', async function(req, res, next) {
  try {
    const pokemonId = req.params.id;

    const randomEnemyId = Math.floor(Math.random() * 100) + 1;
    const enemyPokemonUrl = `https://pokeapi.co/api/v2/pokemon/${randomEnemyId}`;
    const enemyResponse = await axios.get(enemyPokemonUrl);
    const enemyPokemonData = enemyResponse.data;

    const userPokemonUrl = `https://pokeapi.co/api/v2/pokemon/${pokemonId}`;
    const userResponse = await axios.get(userPokemonUrl);
    const userPokemonData = userResponse.data;

    const calculatePower = (pokemon) => {
      const abilitiesCount = pokemon.abilities.length;
      const totalSlotValue = pokemon.abilities.reduce((total, ability) => total + ability.slot, 0);
      const power = Math.log(abilitiesCount * totalSlotValue * pokemon.base_experience);
      return power;
    };

    const userPower = calculatePower(userPokemonData);
    const enemyPower = calculatePower(enemyPokemonData);

    const enemySql = `
        INSERT INTO pokemon_battle (enemy_id, enemy_power, user_pokemon_id)
        VALUES (?, ?, ?)
      `;
    const updateUserPower = 'UPDATE pokemon_captured SET power = ? WHERE id_pokemon = ?';

    db.query(updateUserPower, [userPower, pokemonId], (err, result) => {
      if (err) throw err;

      db.query(enemySql, [randomEnemyId, enemyPower, pokemonId], (err, result) => {
        if (err) throw err;

        console.log(`Batalha entre Pokémon ID ${pokemonId} e Pokémon ID ${randomEnemyId}.`);
        res.json({ message: 'Batalha concluída' });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao batalhar' });
  }
});

router.get('/pokedex', function(req, res, next) {

  const getPokedexQuery = 'SELECT * FROM pokemon_captured';

  db.query(getPokedexQuery, (err, result) => {
    if (err) throw err;

    console.log('Consulta realizada com sucesso.');
    res.json(result);
  });
});

router.get('/pokedex/:id', function(req, res, next) {
  const pokemonId = req.params.id;

  const getPokemonQuery = 'SELECT * FROM pokemon_captured WHERE id_pokemon = ?';

  db.query(getPokemonQuery, [pokemonId], (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      console.log(`Consulta ao Pokémon ID ${pokemonId} realizada com sucesso.`);
      res.json(result[0]);
    } else {
      res.status(404).json({ message: 'Pokémon não encontrado na Pokédex.' });
    }
  });
});

module.exports = router;