var _ = require('lodash')

const dummy = () => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favorite = (blogs) => {
  if (blogs.length === 0) {
    return {}
  }
  const favorite = blogs.reduce((fav, blog) => fav.likes > blog.likes ? fav : blog)
  return { title: favorite.title, author: favorite.author, likes: favorite.likes }
}

const mostBlogs = (blogs) => {
  if (blogs.length === 0) {
    return {}
  }
  if (blogs.length === 1) {
    return { author: blogs[0].author, blogs: 1 }
  }
  const prolific = _(blogs).countBy('author').entries().maxBy(_.last)
  return { author: prolific[0], blogs: prolific[1] }
}

const mostLikes = (blogs) => {
  if (blogs.length === 0) {
    return 0
  }
  let likesByAuthor = blogs.reduce((acc, blog) => {
    if (blog.author in acc) {
      acc[blog.author] += blog.likes
    } else {
      acc[blog.author] = blog.likes
    }
    return acc
  }, {})
  const author = Object.keys(likesByAuthor).reduce((a, b) => likesByAuthor[a] > likesByAuthor[b] ? a : b)
  const likes = likesByAuthor[author]
  return { author, likes }
}

module.exports = {
  dummy,
  totalLikes,
  favorite,
  mostBlogs,
  mostLikes
}