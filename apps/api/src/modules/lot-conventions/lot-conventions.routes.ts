import { Router } from 'express';
import { LotConventionsController } from './lot-conventions.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();
const lotConventionsController = new LotConventionsController();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /lot-conventions - Récupérer tous les lots/conventions
router.get('/', lotConventionsController.findAll.bind(lotConventionsController));

// GET /lot-conventions/quality-group/:qualityGroupId - Récupérer les lots/conventions d'un groupe de qualité
router.get('/quality-group/:qualityGroupId', lotConventionsController.findByQualityGroupId.bind(lotConventionsController));

// GET /lot-conventions/:id - Récupérer un lot/convention par ID
router.get('/:id', lotConventionsController.findById.bind(lotConventionsController));

// POST /lot-conventions - Créer un nouveau lot/convention
router.post('/', lotConventionsController.create.bind(lotConventionsController));

// PUT /lot-conventions/:id - Mettre à jour un lot/convention
router.put('/:id', lotConventionsController.update.bind(lotConventionsController));

// DELETE /lot-conventions/:id - Supprimer un lot/convention
router.delete('/:id', lotConventionsController.delete.bind(lotConventionsController));

export default router;
