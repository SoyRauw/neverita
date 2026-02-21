import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { db } from './db.js';
import { router as familiesRouter } from './routes/families.js';
import { router as ingredientsRouter } from './routes/ingredients.js';
import { router as inventoryRouter } from './routes/inventory.js';
import { router as menuPlansRouter } from './routes/menu_plans.js';
import { router as menuPlansRecipesRouter } from './routes/menu_plans_recipes.js';
import { router as recipesRouter } from './routes/recipes.js';
import { router as recipeIngredientsRouter } from './routes/recipe_ingredients.js';
import { router as usersRouter } from './routes/users.js';
import { router as userFamilyRouter } from './routes/user_family.js';
import { errorHandler } from './utils/errorHandler.js';
import { router as aiRecipesRouter } from './routes/ai_recipes.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: 'DB connection failed' });
  }
});

app.use('/families', familiesRouter);
app.use('/ingredients', ingredientsRouter);
app.use('/inventory', inventoryRouter);
app.use('/menu-plans', menuPlansRouter);
app.use('/menu_plans', menuPlansRouter); // alias with underscore
app.use('/menu-plans-recipes', menuPlansRecipesRouter);
app.use('/menu_plans_recipes', menuPlansRecipesRouter); // alias with underscore
app.use('/daily_meals', menuPlansRecipesRouter); // alias to daily_meals table
app.use('/daily-meals', menuPlansRecipesRouter); // dashed alias
app.use('/recipes', recipesRouter);
app.use('/recipe-ingredients', recipeIngredientsRouter);
app.use('/recipe_ingredients', recipeIngredientsRouter); // alias with underscore
app.use('/users', usersRouter);
app.use('/user-family', userFamilyRouter);
app.use('/user_family', userFamilyRouter); // alias with underscore
app.use('/families', familiesRouter);
app.use('/ai', aiRecipesRouter);

app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
