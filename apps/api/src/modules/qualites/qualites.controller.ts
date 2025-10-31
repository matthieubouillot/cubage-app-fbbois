import { Request, Response } from 'express';
import { QualitesService, CreateQualiteDTO, UpdateQualiteDTO } from './qualites.service';

const qualitesService = new QualitesService();

export class QualitesController {
  async findAll(req: Request, res: Response) {
    try {
      const qualites = await qualitesService.findAll();
      res.json(qualites);
    } catch (error) {
      console.error('Error fetching qualites:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const qualite = await qualitesService.findById(id);
      
      if (!qualite) {
        return res.status(404).json({ error: 'Qualite not found' });
      }
      
      res.json(qualite);
    } catch (error) {
      console.error('Error fetching qualite:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data: CreateQualiteDTO = req.body;
      
      if (!data.name || data.name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
      }

      const qualite = await qualitesService.create(data);
      res.status(201).json(qualite);
    } catch (error: any) {
      console.error('Error creating qualite:', error);
      
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Qualite with this name already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateQualiteDTO = req.body;
      
      if (!data.name || data.name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
      }

      const qualite = await qualitesService.update(id, data);
      res.json(qualite);
    } catch (error: any) {
      console.error('Error updating qualite:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Qualite not found' });
      }
      
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Qualite with this name already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await qualitesService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting qualite:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Qualite not found' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
