import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { auditLog } from './middleware/audit.js';

// Routes
import authRoutes from './routes/auth.js';
import companiesRoutes from './routes/companies.js';
import clientsRoutes from './routes/clients.js';
import invoicesRoutes from './routes/invoices.js';
import paymentsRoutes from './routes/payments.js';
import teamRoutes from './routes/team.js';
import dashboardRoutes from './routes/dashboard.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import auditRoutes from './routes/audit.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Middlewares de sécurité
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // En développement, autoriser plusieurs origines
    const allowedOrigins = [
      config.cors.origin,
      'http://localhost:5173', // Vite dev server
      'http://localhost:4173', // Vite preview
      'http://localhost:8080', // Autre port possible
    ];
    
    // Autoriser les requêtes sans origine (Postman, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Audit logging (pour les routes authentifiées, excluant les routes d'auth)
app.use('/api/', (req, res, next) => {
  // Exclure les routes d'authentification du middleware audit
  if (req.path.startsWith('/auth')) {
    return next();
  }
  return auditLog(req, res, next);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Démarrage du serveur (uniquement si exécuté directement, pas sur Vercel)
// Vérifier si le fichier est exécuté directement (compatible avec les modules ES)
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename || !process.env.VERCEL;

if (isMainModule) {
  const PORT = config.port;

  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📝 Environnement: ${config.nodeEnv}`);
    console.log(`🌐 CORS autorisé pour: ${config.cors.origin}`);
  });
}

// Export pour Vercel Functions
export default app;

