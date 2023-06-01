/* eslint-disable */
const mongoose = require('mongoose')
const supertest = require('supertest')
const config = require('../utils/config')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const Blog = require('../models/blog')
const User = require('../models/user')

beforeEach(async () => {
  /*initial blogs don't have users*/
  await Blog.deleteMany({})
  let blogObject = new Blog(helper.initialBlogs[0])
  await blogObject.save()
  blogObject = new Blog(helper.initialBlogs[1])
  await blogObject.save()
  /*no users initially, test user added*/
  await User.deleteMany({})
  const passwordHash = await bcrypt.hash('salainensana', 10)
  const newUser = new User({ username: 'testikäyttäjä', passwordHash })
  await newUser.save()
  /*test user logs in*/
  const logIn = { username: 'testikäyttäjä', id: newUser.id }
  return (token = jwt.sign(logIn, config.SECRET))
})

describe('initial blog list', () => {
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('there are two notes', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('the first blog is about React patterns', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body[0].title).toBe(helper.initialBlogs[0].title)
  })

  test('identifying variable is named ID', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body[0].id).toBeDefined()
  })
})

describe('adding a note', () => {
  test('succeeds with valid blog and authorized user ', async () => {
    const newBlog = {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
      likes: 12
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set({ Authorization: `Bearer ${token}` })
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAfter = await helper.blogsInDb()
    expect(blogsAfter).toHaveLength(helper.initialBlogs.length +1)

    const titles = blogsAfter.map(b => b.title)

    expect(blogsAfter).toHaveLength(helper.initialBlogs.length + 1)
    expect(titles).toContain(
      'Canonical string reduction'
    )
  })

  test('doesn\'t work without a title (code 400)', async () => {
    const newBlog = {
      author: 'Edsger W. Dijkstra',
      url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
      likes: 12
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set({ Authorization: `Bearer ${token}` })
      .expect(400)

    const blogsAfter = await helper.blogsInDb()
    expect(blogsAfter).toHaveLength(helper.initialBlogs.length)
  })

  test('doesn\'t work without an url (code 400)', async () => {
    const newBlog = {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      likes: 12
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set({ Authorization: `Bearer ${token}` })
      .expect(400)

    const blogsAfter = await helper.blogsInDb()
    expect(blogsAfter).toHaveLength(helper.initialBlogs.length)
  })

  test('likes default to zero', async () => {
    const newBlog = {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html'
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set({ Authorization: `Bearer ${token}` })
      .expect(201)

    const blogsAfter = await helper.blogsInDb()
    const likes = blogsAfter.map(b => [b.title, b.likes])
    expect(likes).toContainEqual(
      ['Canonical string reduction', 0]
    )
  })
})

describe('deletion of a note', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set({ Authorization: `Bearer ${token}` })
      .expect(204)

    const blogsAfter = await helper.blogsInDb()

    expect(blogsAfter).toHaveLength(
      helper.initialBlogs.length - 1
    )

    const contents = blogsAfter.map(r => r.title)

    expect(contents).not.toContain(blogToDelete.title)
  })
  test('fails with status code 401 if user is unauthorized', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(401)

    const blogsAfter = await helper.blogsInDb()

    expect(blogsAfter).toHaveLength(helper.initialBlogs.length)
  })
})

describe('editing a note', () => {
  test('works when authorized user adds a like', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToEdit = blogsAtStart[0]
    const editedBlog = {
      ...blogToEdit,
      likes: blogToEdit.likes + 1
    }

    const resultBlog = await api
      .put(`/api/blogs/${blogToEdit.id}`)
      .send(editedBlog)
      .set({ Authorization: `Bearer ${token}` })
      .expect(200)

    expect(resultBlog.body).toEqual(editedBlog)
  })
  test('fails with status code 401 if user is unauthorized', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToEdit = blogsAtStart[0]
    const editedBlog = {
      ...blogToEdit,
      likes: blogToEdit.likes + 1
    }

    await api
      .put(`/api/blogs/${blogToEdit.id}`)
      .send(editedBlog)
      .expect(401)
  })
})


afterAll(async () => {
  await mongoose.connection.close()
})