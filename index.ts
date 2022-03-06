import express from 'express'
import Database  from "better-sqlite3";
import cors from "cors";

const db = new Database('./data.db',{
    verbose: console.log
})

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 5000;

// Get all users
const getAllUsers = db.prepare(`SELECT * FROM users`)


// Get all posts and join with the users table and subreddits table
const getAllPosts = db.prepare(`
    SELECT posts.id, posts.title, posts.content, users.username, posts.rating, posts.upvotes, posts.downvotes, subreddits.name AS subreddit FROM users
    JOIN posts ON users.id = posts.user
    JOIN subreddits ON subreddits.id = posts.subreddit
`)

// Get single user with id
const getSingleUser = db.prepare(`SELECT * FROM users WHERE id=?`)


// Get all posts in a descending order
const getAllPostsOrderedByRatingDESC =  db.prepare(`
    SELECT posts.id, posts.title, posts.content, users.username, posts.rating, posts.upvotes, posts.downvotes, subreddits.name AS subreddit FROM users
    JOIN posts ON users.id = posts.user
    JOIN subreddits ON subreddits.id = posts.subreddit
    ORDER BY rating DESC;
`)



// Get all posts from a user
const getPostsWithUserID = db.prepare(`
    SELECT posts.id, posts.title, posts.content, posts.rating, posts.upvotes, posts.downvotes, subreddits.name AS subreddit FROM posts
    JOIN subreddits ON subreddits.id = posts.subreddit
    WHERE posts.user = ?;
`)

// Get all posts on a subreddit
const getPostsWithSubredditID = db.prepare(`
    SELECT posts.id, posts.title, posts.content, users.username, posts.rating, posts.upvotes, posts.downvotes FROM posts
    JOIN  users ON users.id = posts.user
    WHERE posts.subreddit = ?
`)

// Get a single post with id and join it with users table and subreddits to get the names
const getPostWithID = db.prepare(`
    SELECT posts.id, posts.title, posts.content, users.username, posts.rating, posts.upvotes, posts.downvotes, subreddits.name AS subreddit FROM users
    JOIN posts ON users.id = posts.user
    JOIN subreddits ON subreddits.id = posts.subreddit
    WHERE posts.id=?;
    `)

// Get all comments on a post and join with users to get the name 
const getCommentsWithPostID = db.prepare(`
    SELECT comments.id, comments.comment, users.username FROM comments
    JOIN users ON users.id = comments.user
    WHERE comments.post = ?;
`)

// Get all comments from a user and join it with posts table to see in which post was the comment on
const getCommentsWithUserID = db.prepare(`
    SELECT comments.id, comments.comment, posts.title, posts.content, posts.id as postID, users.username AS postOwner FROM comments
    JOIN posts ON posts.id = comments.post
    JOIN users ON users.id = posts.user 
    WHERE comments.user = ?;
`)

const getCommentWithID = db.prepare(`SELECT * FROM comments WHERE id=?`)

// Get all subreddits
const getAllSubreddits = db.prepare(`SELECT* FROM subreddits`)

const getSubredditsWithUserID = db.prepare(`
    SELECT subredditUsers.dateJoined, subreddits.name AS subredditName FROM subredditUsers
    JOIN subreddits ON subreddits.id = subredditUsers.subredditID
    WHERE subredditUsers.userID = ?; 
`)

// const getAllUsersWithSubredditID = db.prepare(`
//     SELECT users.username, subreddits.name FROM users
//     JOIN users on users.id = subreddit
//     WHERE subreddits.id = ?
// `)


// Create User
const createUser = db.prepare(`INSERT INTO users(name,username, email,password) VALUES(?,?,?,?);`)

// Create Post
const createPost = db.prepare(`INSERT INTO posts (title, content, user, subreddit) VALUES(?,?,?,?) `)

// Create Subreddit
const createSubreddit = db.prepare(`INSERT INTO subreddits (name) VALUES(?)`)

// Create comment
const createComment = db.prepare('INSERT INTO comments(comment, user, post) VALUES(?,?,?)')

// Delete user with that id
const deleteUserWithID = db.prepare(`DELETE FROM users WHERE id=?`)


// Home
app.get('/',(req,res)=>{
    res.send(`
        <h1>Reddit backend database API<h1>
        <h3>Check the routes below for data</h3>
        <ul>
            <li>Click here to see: <a href='/posts'>posts</a> </li>
            <li>Click here to see: <a href='/subreddits'>subreddits</a> </li>
        </ul>
    `)
})

// Get single user info and add all the posts and commments that that user created
app.get('/users/:id',(req,res)=>{
    const id = req.params.id
    const user = getSingleUser.get(id)
    user.posts = getPostsWithUserID.all(id)
    user.comments = getCommentsWithUserID.all(id)
    user.subreddits = getSubredditsWithUserID.all(id)
    res.send(user)
})

// Delete User
app.delete('/users/:id',(req, res)=>{
    const id = req.params.id
    const result = deleteUserWithID.run(id)
    if(result.changes > 0){
        res.send({Message:"User deleted succesfully"})
    }
})

// Login the user and send the user info and details along with all the posts and comments
app.post('/sign-in',(req, res)=>{
    const body = req.body
    const allUsers = getAllUsers.all()
    let errors = []

    if(!allUsers.find(user => user.username === body.username && user.password === body.password)) 
        errors.push("Username or password doesnt match")
    if(errors.length === 0){
        const foundUser =  allUsers.find(user => user.username === body.username)
        foundUser.posts = getPostsWithUserID.all(foundUser.id)
        foundUser.comments = getCommentsWithUserID.all(foundUser.id)
        foundUser.subreddits = getSubredditsWithUserID.all(foundUser.id)

        res.send(foundUser)
    } else{
        res.status(400).send({errors})
    }
})

app.post('/sign-up',(req,res)=>{
    const name = req.body.name
    const username = req.body.username
    const email = req.body.email
    const password = req.body.password

    const allUsers = getAllUsers.all()
    let errors = []

    if(typeof name !== "string") errors.push("Name not a string or missing!")
    if(typeof username !== "string") errors.push("Username not a string or missing!")
    if(typeof email !== "string") errors.push("Email not a string or missing!")
    if(typeof password !== "string") errors.push("Password not a string or missing!")

    if(allUsers.find(user => user.email === email)) errors.push("Email already taken, please try a different email")
    if(allUsers.find(user => user.username === username)) errors.push("Username already taken, please try a different username")
    
    if(errors.length === 0){
        const result = createUser.run(name,username,email,password)
        if(result.changes > 0){
            res.send(getSingleUser.get(result.lastInsertRowid))
        }
    } else{
        res.status(400).send({errors})
    }
})

// Get all posts
app.get('/posts',(req,res)=>{
    const allPosts = getAllPostsOrderedByRatingDESC.all()
    for(const post of allPosts){
        post.comments = getCommentsWithPostID.all(post.id)
    }
    res.send(allPosts)    
})

// Create new post
app.post('/posts',(req,res)=>{
    const title = req.body.title
    const content = req.body.content
    const user = req.body.user
    const subreddit = req.body.subreddit

    let errors = []
    if(typeof title !== "string") errors.push("Title is missing")
    if(typeof content !== "string") errors.push("Content is missing")
    if(errors.length === 0){
        let result = createPost.run(title, content,user, subreddit)
        if(result.changes > 0)
        res.send(getPostWithID.get(result.lastInsertRowid))
    }else{
        res.status(400).send({errors})
    }
})

// Get single post
app.get('/posts/:id',(req, res)=>{
    const id = req.params.id
    const postFound = getPostWithID.get(id)
    if(postFound){
        postFound.comments = getCommentsWithPostID.all(id)
        res.send(postFound)
    }else{
        res.status(404).send({error: "Post not found"})
    }
})

// get single subreddit with id
app.get('/subreddits/:id', (req,res)=>{
    const id = req.params.id
    const subredditPosts = getPostsWithSubredditID.all(1)
    for(const post of subredditPosts){
            post.comments = getCommentsWithPostID.all(post.id)
        }
    res.send(subredditPosts)    
})

app.post(`/comments`, (req,res)=>{
    const body = req.body
    const result = createComment.run(body.comment, body.user, body.post)
    if(result.changes > 1){
        let newComment = getCommentWithID.get(result.lastInsertRowid)
        newComment.user = getSingleUser.get(newComment.user) 
        newComment.post = getPostWithID.get(newComment.post) 
        res.send()   
    }
})



app.listen(PORT, ()=>console.log(`Server up and running on http://localhost:${PORT}`))
