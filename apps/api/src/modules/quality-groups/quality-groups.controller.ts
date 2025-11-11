import { Request, Response } from 'express';
import { QualityGroupsService, CreateQualityGroupDTO, UpdateQualityGroupDTO } from './quality-groups.service';

const qualityGroupsService = new QualityGroupsService();

export class QualityGroupsController {
  async findAll(req: Request, res: Response) {
    try {
      const qualityGroups = await qualityGroupsService.findAll();
      res.json(qualityGroups);
    } catch (error) {
      console.error('Error fetching quality groups:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const qualityGroup = await qualityGroupsService.findById(id);
      
      if (!qualityGroup) {
        return res.status(404).json({ error: 'Quality group not found' });
      }
      
      res.json(qualityGroup);
    } catch (error) {
      console.error('Error fetching quality group:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data: CreateQualityGroupDTO = req.body;
      
      if (!data.name || data.name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
      }
      
      if (!data.qualiteId) {
        return res.status(400).json({ error: 'Qualite ID is required' });
      }
      
      if (!data.scieurId) {
        return res.status(400).json({ error: 'Scieur ID is required' });
      }
      
      if (!data.essenceIds || data.essenceIds.length === 0) {
        return res.status(400).json({ error: 'At least one essence is required' });
      }
      
      if (typeof data.pourcentageEcorce !== 'number' || data.pourcentageEcorce < 0 || data.pourcentageEcorce > 100) {
        return res.status(400).json({ error: 'Pourcentage ecorce must be a number between 0 and 100' });
      }

      const qualityGroup = await qualityGroupsService.create(data);
      res.status(201).json(qualityGroup);
    } catch (error: any) {
      console.error('Error creating quality group:', error);
      
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Quality group with this name already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateQualityGroupDTO = req.body;
      
      if (!data.name || data.name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
      }
      
      if (!data.qualiteId) {
        return res.status(400).json({ error: 'Qualite ID is required' });
      }
      
      if (!data.scieurId) {
        return res.status(400).json({ error: 'Scieur ID is required' });
      }
      
      if (!data.essenceIds || data.essenceIds.length === 0) {
        return res.status(400).json({ error: 'At least one essence is required' });
      }
      
      if (typeof data.pourcentageEcorce !== 'number' || data.pourcentageEcorce < 0 || data.pourcentageEcorce > 100) {
        return res.status(400).json({ error: 'Pourcentage ecorce must be a number between 0 and 100' });
      }

      const qualityGroup = await qualityGroupsService.update(id, data);
      res.json(qualityGroup);
    } catch (error: any) {
      console.error('Error updating quality group:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Quality group not found' });
      }
      
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Quality group with this name already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await qualityGroupsService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting quality group:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Quality group not found' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
