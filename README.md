# Blog API
API RESTful pour la gestion d'articles de blog developpee avec Node.js, Express, SQLite et Swagger.
## Technologies utilisees
- Node.js
- Express
- SQLite
- Swagger
### Installation
```bash
npm install
npm start
## Endpoints
POST /api/articles : creer un article
GET /api/articles : Lister les articles
GET /api/articles/{id} : Recuperer un article
PUT /api/articles/{id} : modifier un article
DELETE /api/articles/{id} : supprimer un article
GET /api/articles/search : Rechercher un article
## Documentation Swagger
http://localhost:3000/api-docs
