import { Router } from 'express';
import { EssencesController } from './essences.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();
const essencesController = new EssencesController();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /essences - Récupérer toutes les essences
router.get('/', essencesController.findAll.bind(essencesController));

// GET /essences/:id - Récupérer une essence par ID
router.get('/:id', essencesController.findById.bind(essencesController));

// POST /essences - Créer une nouvelle essence
router.post('/', essencesController.create.bind(essencesController));

// PUT /essences/:id - Mettre à jour une essence
router.put('/:id', essencesController.update.bind(essencesController));

// DELETE /essences/:id - Supprimer une essence
router.delete('/:id', essencesController.delete.bind(essencesController));

export default router;