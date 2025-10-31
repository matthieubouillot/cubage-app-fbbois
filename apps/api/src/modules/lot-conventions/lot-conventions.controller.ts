import { Request, Response } from 'express';
import { LotConventionsService, CreateLotConventionDTO, UpdateLotConventionDTO } from './lot-conventions.service';

const lotConventionsService = new LotConventionsService();

export class LotConventionsController {
  async findAll(req: Request, res: Response) {
    try {
      const lotConventions = await lotConventionsService.findAll();
      res.json(lotConventions);
    } catch (error) {
      console.error('Error fetching lot conventions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async findByQualityGroupId(req: Request, res: Response) {
    try {
      const { qualityGroupId } = req.params;
      const lotConventions = await lotConventionsService.findByQualityGroupId(qualityGroupId);
      res.json(lotConventions);
    } catch (error) {
      console.error('Error fetching lot conventions by quality group:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const lotConvention = await lotConventionsService.findById(id);
      
      if (!lotConvention) {
        return res.status(404).json({ error: 'Lot convention not found' });
      }
      
      res.json(lotConvention);
    } catch (error) {
      console.error('Error fetching lot convention:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data: CreateLotConventionDTO = req.body;
      
      if (!data.lot || data.lot.trim() === '') {
        return res.status(400).json({ error: 'Lot is required' });
      }
      
      if (!data.convention || data.convention.trim() === '') {
        return res.status(400).json({ error: 'Convention is required' });
      }
      
      if (!data.qualityGroupId) {
        return res.status(400).json({ error: 'Quality group ID is required' });
      }

      const lotConvention = await lotConventionsService.create(data);
      res.status(201).json(lotConvention);
    } catch (error: any) {
      console.error('Error creating lot convention:', error);
      
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Lot convention with this lot and convention already exists for this quality group' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateLotConventionDTO = req.body;
      
      if (!data.lot || data.lot.trim() === '') {
        return res.status(400).json({ error: 'Lot is required' });
      }
      
      if (!data.convention || data.convention.trim() === '') {
        return res.status(400).json({ error: 'Convention is required' });
      }

      const lotConvention = await lotConventionsService.update(id, data);
      res.json(lotConvention);
    } catch (error: any) {
      console.error('Error updating lot convention:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Lot convention not found' });
      }
      
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Lot convention with this lot and convention already exists for this quality group' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await lotConventionsService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting lot convention:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Lot convention not found' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
