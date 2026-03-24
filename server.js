const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { initDatabase, database} = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log('Body recu:', req.body);
    next();
});
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Blog API',
            version: '1.0.0',
            description: 'API de gestion d\'articles de blog'
        },
        servers: [{ url: `http://localhost:${PORT}`}]
    },
    apis: ['./server.js']
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/', (req,res) => {
    res.send('API Blog en ligne');
});
/**
 * @swagger
 * /api/articles:
 *   post:
 *     summary: creer un article
 *     tags: [Articles]
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - title
 *              - content
 *              - author
 *              - category
 *              - tags
 *            properties:
 *              title:
 *                type: string
 *              content:
 *                type: string
 *              author:
 *                type: string
 *              date:
 *                type: string
 *                format: date
 *              category:
 *                type: string
 *              tags:
 *                type: string
 *                items:
 *                  type: string
 *   responses:
 *      201:
 *        description: Article cree
 */
app.post('/api/articles', async (req, res) => {
    try {
        const { title, content, author, date, category, tags } = req.body;
        if (!title || !content || !author || !category || !tags) {
            return res.status(400).json({ error: 'champs requis manquant'});
        }
        const articleDate = date || new Date().toISOString().split('T')[0];
        const article = await database.createArticle({
            title,
            content,
            author,
            date: articleDate,
            category,
            tags,
        });
        res.status(201).json(article);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur'});
    }  
    });
  /**
   * @swagger
   * /api/articles:
   *   get:
   *     summary: Recuperer tous les articles
   *     tags: [Articles]
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *       - in: query
   *         name: author
   *         schema:
   *           type: string
   *       - in: query
   *         name: date
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: Liste des articles
   */
  app.get('/api/articles', async (req, res) => {
    try {
        const { category, author, date } = req.query;
        const articles = await database.getArticles({ category, author, date });
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
  });
  /**
   * @swagger
   *  /api/articles/{id}:
   *   get:
   *     summmary: recuperer un article
   *     tags: [Articles]
   *     parameters:
   *       - in: query
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Article trouve 
   *       404: 
   *         description: Article non trouve
   */
  app.get('/api/articles/:id', async (req, res) => {
    try {
        const article = await database.getArticleById(parseInt(req.params.id));
        if (!article) return res.status(404).json({ error: 'Article non trouve'});
        res.json(article);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur'});
    }
});
/**
   * @swagger
   * /api/articles/search:
   *   get:
   *     summmary: rechercher des articles
   *     tags: [Articles]
   *     parameters:
   *       - in: query
   *         name: query
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Articles correspondants
   */
  app.get('api/articles/search', async (req, res) => {
    try {
        const {query} = req.query;
        if (!query) return res.status(400).json({ error: 'Parametre query requis' });
        const articles = await database.searchArticles(query);
        res.json(articles);
    } catch (error){
        res.status(500).json({ error: 'Erreur serveur' });
    }
  });
  /** 
   * @swagger
   * /api/articles/{id}:
   *   put:
   *      summary: Mettre a jour un article
   *      tags: [Articles]
   *      parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *      requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               content:
   *                 type: string
   *               category:
   *                 type: string
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *      responses:
   *        200:
   *          description: Article mis a jour
   *        404: 
   *          description: Article non trouve
   */
  app.put('/api/articles/:id', async (req, res) => {
    try {
        const updated = await database.updateArticle(parseInt(req.params.id), req.body);
        if (!updated) return res.status(404).json({ error: 'Article non trouve' });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
  });
  /**
   * @swagger
   * /api/articles/{id}:
   *   delete:
   *     summary: Supprimer un article
   *     tags: [Articles]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Article supprime
   *       404:
   *         description: Article non trouve 
   */
  app.delete('/api/articles/:id', async (req, res) => {
    try {
        const deleted = await database.deleteArticle(parseInt(req.params.id));
        if (!deleted) return res.status(404).json({ error: 'Article non trouve'});
        res.json({ message: 'Article supprime'});
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur'});
    }
  });
  async function startServer() {
    try {
        await initDatabase();
        app.listen(PORT, () => {
            console.log(`serveur demarre sur http://localhost:${PORT}`);
            console.log(`Documentation Swagger : http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error('Erreur au demarrage:', error);
        process.exit(1);
    }
  }
  startServer();