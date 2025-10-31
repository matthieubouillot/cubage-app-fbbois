import { Router } from 'express';
import { QualityGroupsController } from './quality-groups.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();
const qualityGroupsController = new QualityGroupsController();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// GET /quality-groups - Récupérer tous les groupes de qualité
router.get('/', qualityGroupsController.findAll.bind(qualityGroupsController));

// GET /quality-groups/:id - Récupérer un groupe de qualité par ID
router.get('/:id', qualityGroupsController.findById.bind(qualityGroupsController));

// POST /quality-groups - Créer un nouveau groupe de qualité
router.post('/', qualityGroupsController.create.bind(qualityGroupsController));

// PUT /quality-groups/:id - Mettre à jour un groupe de qualité
router.put('/:id', qualityGroupsController.update.bind(qualityGroupsController));

// DELETE /quality-groups/:id - Supprimer un groupe de qualité
router.delete('/:id', qualityGroupsController.delete.bind(qualityGroupsController));

export default router;
