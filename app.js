const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const sqlite = require('better-sqlite3');
const path = require('path');
const session = require('express-session');
const dotenv = require('dotenv');

const db = sqlite('./db/db.db', { verbose: console.log });

const app = express();
const saltRounds = 10;
const port = process.env.PORT || 80;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'SESSION_SECRET',
    resave: false,
    saveUninitialized: true
}));

// Paths for the views
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/login/login.html'));
});
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/login/registrere.html'));
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/index.html'));
});

// Path for the blog post creation page
app.get('/create-post', checkAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/create-post.html'));
});

// Path for the blog posts viewing page
app.get('/posts', (req, res) => {
    const stmt = db.prepare('SELECT * FROM blog_posts ORDER BY created_at DESC');
    const posts = stmt.all();
    res.json(posts); // For simplicity, returning posts as JSON
});





app.get('/posts', (req, res) => {
    const stmt = db.prepare('SELECT * FROM blog_posts ORDER BY created_at DESC');
    const posts = stmt.all();
    res.json(posts);
});
app.get('/post/:id', (req, res) => {
    const postId = req.params.id;
    const stmt = db.prepare('SELECT * FROM blog_posts WHERE post_id = ?');
    const post = stmt.get(postId);

    if (post) {
        res.sendFile(path.join(__dirname, '/public/html/post.html'));
    } else {
        res.status(404).send('Post not found');
    }
});

app.get('/api/post/:id', (req, res) => {
    const postId = req.params.id;
    const stmt = db.prepare('SELECT * FROM blog_posts WHERE post_id = ?');
    const post = stmt.get(postId);

    if (post) {
        res.json(post);
    } else {
        res.status(404).send('Post not found');
    }
});

app.get('/api/quiz/:id', (req, res) => {
    const quizId = req.params.id;

    const quizStmt = db.prepare('SELECT * FROM quizzes WHERE quiz_id = ?');
    const quiz = quizStmt.get(quizId);

    if (quiz) {
        const questionsStmt = db.prepare('SELECT * FROM questions WHERE quiz_id = ?');
        const questions = questionsStmt.all(quizId);
        quiz.questions = questions;
        res.json(quiz);
    } else {
        res.status(404).send('Quiz not found');
    }
});





// Paths for the API post requests
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const stmt = db.prepare('SELECT * FROM user WHERE email = ?');
    const user = stmt.get(email);

    if (!user) {
        return res.status(400).send("No user found with that email.");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
        req.session.userId = user.userid;
        req.session.username = user.username;
        req.session.isAuthenticated = true;
        req.session.userrole = user.role_id;
        req.session.loggedIn = true;

        switch (user.role_id) {
            case 1:
                res.redirect('/admin');
                break;
            case 2:
                res.redirect('/');
                break;
            default:
                res.status(500).send("Invalid role.");
        }
    } else {
        res.status(400).send("Invalid password.");
    }
});

app.post('/registerer', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
        const insertStmt = db.prepare('INSERT INTO user (username, email, password, role_id) VALUES (?, ?, ?, ?)');
        const insertInfo = insertStmt.run(username, email, hashedPassword, '1'); // Assuming '2' is the default role for new users

        const userId = insertInfo.lastInsertRowid;

        req.session.userId = userId;
        req.session.isAuthenticated = true;

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to register.");
    }
});

// API to create a new blog post
app.post('/create-post', checkAdmin, (req, res) => {
    const { title, content } = req.body;
    const authorId = req.session.userId;

    const stmt = db.prepare('INSERT INTO blog_posts (title, content, author_id) VALUES (?, ?, ?)');
    stmt.run(title, content, authorId);

    res.redirect('/posts');
});

app.post('/create-quiz', checkAdmin, (req, res) => {
    const { title, description, questions } = req.body; // `questions` should be an array of question texts

    const quizStmt = db.prepare('INSERT INTO quizzes (title, description) VALUES (?, ?)');
    const quizInfo = quizStmt.run(title, description);
    const quizId = quizInfo.lastInsertRowid;

    const questionStmt = db.prepare('INSERT INTO questions (quiz_id, question_text) VALUES (?, ?)');
    questions.forEach(question => {
        questionStmt.run(quizId, question);
    });

    res.redirect('/admin');
});

app.post('/submit-quiz', checkLoggedIn, (req, res) => {
    const { userId } = req.session;
    const { responses } = req.body; // `responses` should be an array of { questionId, answer }

    const responseStmt = db.prepare('INSERT INTO responses (user_id, question_id, answer) VALUES (?, ?, ?)');
    responses.forEach(response => {
        responseStmt.run(userId, response.questionId, response.answer);
    });

    res.redirect('/');
});



// Middleware to check login status
function checkLoggedIn(req, res, next) {
    if (req.session && req.session.loggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Middleware to check if user is admin
function checkAdmin(req, res, next) {
    if (req.session && req.session.loggedIn && req.session.userrole === 1) {
        next();
    } else {
        res.status(403).send("Access denied.");
    }
}

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
