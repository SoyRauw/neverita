# Menu API

Simple Node.js + Express REST API for the `menu` MySQL/MariaDB schema.

## Prerequisites
- Node.js 18+
- MySQL/MariaDB running locally
- Database `menu` created and schema imported (use your provided SQL dump)

## Setup
1. Edit `.env` with your DB credentials:
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=menu
PORT=3000
```
2. Install dependencies:
```
npm install
```
3. Start the server:
```
npm run dev
```

## Endpoints
- `GET /health` – DB connectivity check

Tables:
- `families` → `/families`
- `ingredients` → `/ingredients`
- `inventory` → `/inventory`
- `menu_plans` → `/menu-plans`
- `menu_plans_recipes` → `/menu-plans-recipes`
- `recipes` → `/recipes`
- `recipe_ingredients` → `/recipe-ingredients`
- `users` → `/users` (password is stored as plain text for demo only; do not use in production)
- `user_family` → `/user-family`

Each table supports:
- `GET /` list
- `GET /:id` or composite keys as documented
- `POST /` create
- `PUT /:id` or composite
- `DELETE /:id` or composite

## Notes
- Enum and default fields follow the SQL schema.
- Minimal validation; add more as needed.
- Use Postman or curl to test.
