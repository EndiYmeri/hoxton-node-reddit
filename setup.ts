import Database  from "better-sqlite3";

const db = new Database('./data.db',{
    verbose: console.log
})

const users = [
    {username: "Endi1", email: "endi1ymeri20@gmail.com", password: "1234"},
    {username: "Endi2", email: "endi2ymeri20@gmail.com", password: "1234"},
    {username: "Endi3", email: "endi3ymeri20@gmail.com", password: "1234"}
]
const subreddits = [
    {name: "firstPosts"},
    {name: "secondPosts"},
    {name: "thirdPosts"}
]

const posts = [
    {post: "My first reddit post", user: 1, subreddit: 1},
    {post: "My first reddit post", user: 2, subreddit: 1},
    {post: "My second reddit post", user: 3, subreddit: 2},
    {post: "My third reddit post", user: 2, subreddit: 3},
    {post: "My second reddit post", user: 1, subreddit: 2},
    {post: "My third reddit post", user: 1, subreddit: 2}
]

const comments = [
    {comment:"First Comment", user: 2, post:1},
    {comment:"First Comment", user: 1, post:2},
    {comment:"First Comment", user: 1, post:3},
    {comment:"Second Comment", user: 2, post:3}
]


db.exec(`
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS subreddits;



CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS subreddits(
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS posts(
    id INTEGER PRIMARY KEY,
    post TEXT NOT NULL,
    user INTEGER NOT NULL,
    rating INTEGER DEFAULT 0, 
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    subreddit INTEGER,
    FOREIGN KEY (user) REFERENCES users(id),
    FOREIGN KEY (subreddit) REFERENCES subreddits(id)
);

CREATE TABLE IF NOT EXISTS comments(
    id INTEGER PRIMARY KEY,
    comment TEXT NOT NULL,
    user INTEGER NOT NULL,
    post INTEGER NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    FOREIGN KEY (user) REFERENCES users(id),
    FOREIGN KEY (post) REFERENCES posts(id)
);

`)

const createUser = db.prepare(`INSERT INTO users (username, email, password) VALUES(?,?,?) `)
const createSubreddit = db.prepare(`INSERT INTO subreddits (name) VALUES(?)`)
const createPost = db.prepare(`INSERT INTO posts (post, user, subreddit) VALUES(?,?,?) `)
const createComment = db.prepare(`INSERT INTO comments (comment, user, post) VALUES(?,?,?) `)

for(const user of users){
    createUser.run(user.username, user.email, user.password)
}
for(const subreddit of subreddits){
    createSubreddit.run(subreddit.name)
}
for(const post of posts){
    createPost.run(post.post, post.user, post.subreddit)
}
for(const comment of comments){
    createComment.run(comment.comment, comment.user, comment.post)
}