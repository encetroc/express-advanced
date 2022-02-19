const express = require('express')
const { get } = require('express/lib/response')
const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/advanced')

const Actor = mongoose.model(
  'Actor',
  mongoose.Schema({
    name: String,
  })
)

const Movie = mongoose.model(
  'Movie',
  mongoose.Schema({
    title: String,
  })
)

const MovieActor = mongoose.model(
  'MovieActor',
  mongoose.Schema({
    actor: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Actor',
    },
    movie: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Movie',
    },
  })
)

const File = mongoose.model(
  'File',
  mongoose.Schema({
    name: String,
    url: String,
  })
)

const app = express()
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.send('hello world')
})

// actor
app.get('/actor', async (req, res) => {
  const actors = await Actor.find()

  const actorsWithMovies = await Promise.all(
    actors.map(async (actor) => {
      return {
        name: actor.name,
        movies: await MovieActor.find({ actor: actor.id }).populate('movie'),
      }
    })
  )

  res.render('actor', { actors: actorsWithMovies })
})

app.post('/actor', async (req, res) => {
  await Actor.create({
    name: req.body.name,
  })
  res.redirect('/actor')
})

// movie
app.get('/movie', async (req, res) => {
  const movies = await Movie.find()
  const actors = await Actor.find()

  const moviesWithActors = await Promise.all(
    movies.map(async (movie) => {
      return {
        title: movie.title,
        actors: await MovieActor.find({ movie: movie.id }).populate('actor'),
      }
    })
  )

  res.render('movie', { movies: moviesWithActors, actors })
})

app.post('/movie', async (req, res) => {
  const movie = await Movie.create({
    title: req.body.title,
  })
  req.body.actors.forEach(async (actorId) => {
    await MovieActor.create({
      actor: actorId,
      movie: movie.id,
    })
  })
  res.redirect('/movie')
})

// file uploda
const fileUploader = require('./cloudinary.config')

app.get('/file', async (req, res) => {
  const images = await File.find()
  res.render('file', { images })
})

app.post('/file', fileUploader.single('file'), async (req, res) => {
  console.log(req.file)
  await File.create({
    name: req.file.originalname,
    url: req.file.path,
  })
  res.redirect('/file')
})

app.listen(3000)
