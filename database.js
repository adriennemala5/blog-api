const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
let db;
async function initDatabase() {
    try {
        db = await open({
            filename: path.join(__dirname, 'blog.db'),
            driver: sqlite3.Database,
        });
        await db.exec(`
            CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXXT NOT NULL,
            author TEXT NOT NULL,
            date TEXT NOT NULL,
            category TEXT NOT NULL,
            tags TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);
            console.log('Base de donnees initialisee avec succes');
            return db;
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    }
    const database = {
        async createArticle(article) {
            const {title, content, author, date, category, tags} = article;
            const result = await db.run(
                `INSERT INTO articles (title, content, author, date, category, tags) VALUES (?, ?, ?, ?, ?, ?)`,
                [title, content, author, date, category, JSON.stringify(tags)]
            );
            return { id: result.lastID, ...article};
        },
        async getArticles(filters = {}) {
            let query = 'SELECT * FROM articles WHERE 1=1';
            const params = [];
            if (filters.category) {
                query += ' AND category = ?';
                params.push(filters.category);
            }
            if (filters.author) {
                query += ' AND author = ?';
                params.push(filters.author);
            }
            if (filters.date) {
                query += ' AND date = ?';
                params.push(filters.date);
            }
            query += ' ORDER BY date DESC';
            const articles = await db.all(query, params);
            return articles.map(article => ({
                ...article,
                tags: JSON.parse(article.tags)
            }));
        },
        async getArticleById(id) {
            const article = await db.get('SELECT * FROM articles WHERE id = ?',[id]);
            if (article) {
                article.tags = JSON.parse(article.tags);
                return article
            }
        },
        async updateArticle(id, updates) {
            const allowedFields = ['title', 'content', 'category', 'tags'];
            const setClauses = [];
            const params = [];
            for (const field of allowedFields) {
                if(updates[field] !== undefined) {
                    setClauses.push(`${field} = ?`);
                    params.push(field === 'tags' ? JSON.stringify(updates[field]) : updates[field]);
                }
            }
            if (setClauses.length == 0) return null;
            setClauses.push('updated_at = CURRENT_TIMESTAMP');
            params.push(id);
            await db.run(`UPDATE articles SET ${setClauses.join(',')} WHERE id = ?`, params);
            return await this.getArticleById(id);
        },
        async deleteArticle(id) {
            const result = await db.run('DELETE FROM articles WHERE id = ?', [id]);
            return result.changes > 0;
        },
        async searchArticles(query) {
            const searchTerm = `%${query}%`;
            const articles = await db.all(
                `SELECT * FROM articles
                WHERE title LIKE ? OR content LIKE ?
                ORDER BY date DESC`,
                [searchTerm, searchTerm]
            );
            return articles.map(article => ({
                ...article,
                tags: JSON.parse(article.tags)
            }));
        },
    };
    module.exports = {initDatabase, database };