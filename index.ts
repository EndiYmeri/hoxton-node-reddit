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

const getSingleUser = db.prepare(`SELECT * FROM users WHERE id=?`)

const getAllPosts = db.prepare(`
    SELECT posts.id, posts.post, users.username, posts.rating, posts.upvotes, posts.downvotes, subreddits.name AS subreddit FROM users
    JOIN posts ON users.id = posts.user
    JOIN subreddits ON subreddits.id = posts.subreddit
`)

const getAllPostsOrderedByRatingDESC =  db.prepare(`
    SELECT posts.id, posts.post, users.username, posts.rating, posts.upvotes, posts.downvotes, subreddits.name AS subreddit FROM users
    JOIN posts ON users.id = posts.user
    JOIN subreddits ON subreddits.id = posts.subreddit
    ORDER BY rating DESC;
`)

const getPostsWithUserID = db.prepare(`
    SELECT posts.id, posts.post, posts.rating, posts.upvotes, posts.downvotes, subreddits.name AS subreddit FROM posts
    JOIN subreddits ON subreddits.id = posts.subreddit
    WHERE posts.user = ?;
`)

const getPostsWithSubredditID = db.prepare(`
    SELECT posts.id, posts.post, users.username, posts.rating, posts.upvotes, posts.downvotes FROM posts
    JOIN  users ON users.id = posts.user
    WHERE posts.subreddit = ?
`)

const getCommentsWithPostID = db.prepare(`
    SELECT comments.id, comments.comment, users.username FROM comments
    JOIN users ON users.id = comments.user
    WHERE comments.post = ?;
`)
const getCommentsWithUserID = db.prepare(`
    SELECT comments.id, comments.comment, posts.post, posts.id as postID, users.username AS postOwner FROM comments
    JOIN posts ON posts.id = comments.post
    JOIN users ON users.id = posts.user 
    WHERE comments.user = ?;
`)


const createUser = db.prepare(`INSERT INTO users(username, email,password) VALUES(?,?,?);`)

app.get('/users/:id',(req,res)=>{
    const id = req.params.id
    const user = getSingleUser.get(id)
    user.posts = getPostsWithUserID.all(id)
    user.comments = getCommentsWithUserID.all(id)

    res.send(user)
})


app.post('/users',(req,res)=>{
    const username = req.body.username
    const email = req.body.email
    const password = req.body.password

    let errors = []

    if(typeof username !== "string") errors.push("Username not a string or missing!")
    if(typeof username !== "string") errors.push("Email not a string or missing!")
    if(typeof username !== "string") errors.push("Password not a string or missing!")

    if(errors.length === 0){
        const result = createUser.run(username,email,password)
        if(result.changes > 0){
            res.send(getSingleUser.get(result.lastInsertRowid))
        }
    } else{
        res.status(406).send({errors})
    }

})

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

app.get('/posts',(req,res)=>{
    const allPosts = getAllPostsOrderedByRatingDESC.all()

    for(const post of allPosts){
        post.comments = getCommentsWithPostID.all(post.id)
    }

    res.send(allPosts)    
})


app.get('/subreddits/:id', (req,res)=>{
    const id = req.params.id
    const subredditPosts = getPostsWithSubredditID.all(1)
    for(const post of subredditPosts){
            post.comments = getCommentsWithPostID.all(post.id)
        }
    res.send(subredditPosts)    
})


app.listen(PORT, ()=>console.log(`Server up and running on http://localhost:${PORT}`))