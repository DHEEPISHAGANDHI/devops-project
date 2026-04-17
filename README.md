# Leaf & Lantern Bookstore (Full Stack)

This project now includes:

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Database: MongoDB (via Mongoose)
- User auth: JWT signup/login for cart usage

## 1) Install

Run in project folder:

npm install

## 2) Configure environment

Copy `.env.example` to `.env` and update values as needed.

No default user is required. You can sign up from the UI.

## 3) Start MongoDB

Make sure MongoDB is running locally or set `MONGODB_URI` to your MongoDB Atlas URI.

## 4) Run app

npm start

Open:

http://localhost:3001

## Docker

Run the full stack with Docker Compose:

docker compose up --build

Then open:

http://localhost:3001

This starts:

 - `web` on port 3001
- `mongo` on port 27017

### Docker MongoDB Host Rule

When your Node app runs inside Docker, do not use `127.0.0.1` for MongoDB.

- Wrong inside container: `mongodb://127.0.0.1:27017/bookstore_db`
- Correct inside container: `mongodb://devops_project-mongo-1:27017/bookstore_db`

Reason: inside a container, `localhost` points to that same container, not to the Mongo container.

## Features

- Books are loaded from MongoDB.
- User can sign up/login from the UI.
- Cart is saved in MongoDB per logged-in user.
