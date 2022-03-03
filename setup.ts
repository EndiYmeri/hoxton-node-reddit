import Database  from "better-sqlite3";

const db = new Database('./data.db',{
    verbose: console.log
})

const users = [
    {name:"Endi Ymeri", username: "Endi1", email: "endi1ymeri20@gmail.com", password: "1234"},
    {name:"Filan Fisteku", username: "Endi2", email: "endi2ymeri20@gmail.com", password: "1234"},
    {name:"Fistek Filani", username: "Endi3", email: "endi3ymeri20@gmail.com", password: "1234"}
]
const subreddits = [
    {name: "firstPosts"},
    {name: "secondPosts"},
    {name: "thirdPosts"}
]

const subredditUsers = [
    {subredditID: 1, userID:1, dateJoined: "3/03/22"},
    {subredditID: 1, userID:2, dateJoined: "3/03/22"},
    {subredditID: 2, userID:3, dateJoined: "3/03/22"},
    {subredditID: 2, userID:1, dateJoined: "3/03/22"},
    {subredditID: 3, userID:1, dateJoined: "3/03/22"}
]

const posts = [
    {title: "My first reddit post",  content:"My post content", user: 1, subreddit: 1},
    {title: "My first reddit post",  content:"My post content", user: 2, subreddit: 1},
    {title: "My second reddit post", content:"My post content",  user: 3, subreddit: 2},
    {title: "My third reddit post",  content:"My post content", user: 2, subreddit: 3},
    {title: "My second reddit post", content:"My post content",  user: 1, subreddit: 2},
    {title: "My third reddit post",  content:"My post content", user: 1, subreddit: 2}
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
DROP TABLE IF EXISTS subredditsUsers;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS subreddits;



CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subreddits(
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subredditUsers(
    id INTEGER PRIMARY KEY,
    subredditID INTEGER NOT NULL,
    userID INTEGER NOT NULL,
    dateJoined TEXT NOT NULL, 
    FOREIGN KEY (subredditID) REFERENCES subreddits(id),
    FOREIGN KEY (userID) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS posts(
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
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

const createUser = db.prepare(`INSERT INTO users (name,username, email, password) VALUES(?,?,?,?) `)
const createSubreddit = db.prepare(`INSERT INTO subreddits (name) VALUES(?)`)
const createSubredditUSers = db.prepare(`INSERT INTO subredditUsers(subredditID, userID, dateJoined) VALUES (?,?,?)`)
const createPost = db.prepare(`INSERT INTO posts (title, content, user, subreddit) VALUES(?,?,?,?) `)
const createComment = db.prepare(`INSERT INTO comments (comment, user, post) VALUES(?,?,?) `)

for(const user of users){
    createUser.run(user.name, user.username, user.email, user.password)
}
for(const subreddit of subreddits){
    createSubreddit.run(subreddit.name)
}
for(const subredditUser of subredditUsers){
    createSubredditUSers.run(subredditUser.subredditID, subredditUser.userID, subredditUser.dateJoined)
}
for(const post of posts){
    createPost.run(post.title, post.content, post.user, post.subreddit)
}
for(const comment of comments){
    createComment.run(comment.comment, comment.user, comment.post)
}