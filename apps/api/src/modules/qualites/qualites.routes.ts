import { Router } from 'express';
import { QualitesController } from './qualites.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();
const qualitesController = new QualitesController();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /qualites - Récupérer toutes les qualités
router.get('/', qualitesController.findAll.bind(qualitesController));

// GET /qualites/:id - Récupérer une qualité par ID
router.get('/:id', qualitesController.findById.bind(qualitesController));

// POST /qualites - Créer une nouvelle qualité
router.post('/', qualitesController.create.bind(qualitesController));

// PUT /qualites/:id - Mettre à jour une qualité
router.put('/:id', qualitesController.update.bind(qualitesController));

// DELETE /qualites/:id - Supprimer une qualité
router.delete('/:id', qualitesController.delete.bind(qualitesController));

export default router;
