CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `role_name` TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS `user` (
  `userid` INTEGER PRIMARY KEY AUTOINCREMENT,
  `username` TEXT NOT NULL,
  `email` TEXT NOT NULL,
  `password` TEXT NOT NULL,
  `first_name` TEXT NOT NULL,
  `last_name` TEXT NOT NULL,
  `phone` TEXT NOT NULL,
  `adresse` TEXT NOT NULL,
  `role_id` INTEGER,
  FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`)
);

CREATE TABLE IF NOT EXISTS `blog_posts` (
  `post_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `title` TEXT NOT NULL,
  `content` TEXT NOT NULL,
  `author_id` INTEGER,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`author_id`) REFERENCES `user` (`userid`)
);
CREATE TABLE IF NOT EXISTS `quizzes` (
  `quiz_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `title` TEXT NOT NULL,
  `description` TEXT
);

CREATE TABLE IF NOT EXISTS `questions` (
  `question_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `quiz_id` INTEGER,
  `question_text` TEXT NOT NULL,
  FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`quiz_id`)
);

CREATE TABLE IF NOT EXISTS `responses` (
  `response_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `user_id` INTEGER,
  `question_id` INTEGER,
  `answer` TEXT NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user` (`userid`),
  FOREIGN KEY (`question_id`) REFERENCES `questions` (`question_id`)
);
