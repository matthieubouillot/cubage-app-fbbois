import { Router } from 'express';
import { ScieursController } from './scieurs.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();
const scieursController = new ScieursController();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /scieurs - Récupérer tous les scieurs
router.get('/', scieursController.findAll.bind(scieursController));

// GET /scieurs/:id - Récupérer un scieur par ID
router.get('/:id', scieursController.findById.bind(scieursController));

// POST /scieurs - Créer un nouveau scieur
router.post('/', scieursController.create.bind(scieursController));

// PUT /scieurs/:id - Mettre à jour un scieur
router.put('/:id', scieursController.update.bind(scieursController));

// DELETE /scieurs/:id - Supprimer un scieur
router.delete('/:id', scieursController.delete.bind(scieursController));

export default router;
