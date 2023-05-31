const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})
  let blogObject = new Blog(helper.initialBlogs[0])
  await blogObject.save()
  blogObject = new Blog(helper.initialBlogs[1])
  await blogObject.save()
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
  test('that is valid works ', async () => {
      const newBlog = {
          title: "Canonical string reduction",
          author: "Edsger W. Dijkstra",
          url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
          likes: 12
      }
    
      await api
        .post('/api/blogs')
        .send(newBlog)
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
          author: "Edsger W. Dijkstra",
          url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
          likes: 12
      }
    
      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)
    
      const blogsAfter = await helper.blogsInDb()
      expect(blogsAfter).toHaveLength(helper.initialBlogs.length)
    })

    test('doesn\'t work without an url (code 400)', async () => {
      const newBlog = {
          title: "Canonical string reduction",
          author: "Edsger W. Dijkstra",
          likes: 12
      }
    
      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)
    
      const blogsAfter = await helper.blogsInDb()
      expect(blogsAfter).toHaveLength(helper.initialBlogs.length)
    })
    
    test('likes default to zero', async () => {
      const newBlog = {
          title: "Canonical string reduction",
          author: "Edsger W. Dijkstra",
          url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html"
      }
    
      await api
        .post('/api/blogs')
        .send(newBlog)
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
      .expect(204)

    const blogsAfter = await helper.blogsInDb()

    expect(blogsAfter).toHaveLength(
      helper.initialBlogs.length - 1
    )

    const contents = blogsAfter.map(r => r.title)

    expect(contents).not.toContain(blogToDelete.title)
  })
})

describe('editing a note', () => {
  test('works when adding a like', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToEdit = blogsAtStart[0]
    const editedBlog = {
      ...blogToEdit, 
      likes: blogToEdit.likes + 1
    }

    const resultBlog = await api
      .put(`/api/blogs/${blogToEdit.id}`)
      .send(editedBlog)
      .expect(200)

    expect(resultBlog.body).toEqual(editedBlog)
  })
})


afterAll(async () => {
  await mongoose.connection.close()
})