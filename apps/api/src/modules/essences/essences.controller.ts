import { Request, Response } from 'express';
import { EssencesService, CreateEssenceDTO, UpdateEssenceDTO } from './essences.service';

const essencesService = new EssencesService();

export class EssencesController {
  async findAll(req: Request, res: Response) {
    try {
      const essences = await essencesService.findAll();
      res.json(essences);
    } catch (error) {
      console.error('Error fetching essences:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const essence = await essencesService.findById(id);
      
      if (!essence) {
        return res.status(404).json({ error: 'Essence not found' });
      }
      
      res.json(essence);
    } catch (error) {
      console.error('Error fetching essence:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data: CreateEssenceDTO = req.body;
      
      if (!data.name || data.name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
      }

      const essence = await essencesService.create(data);
      res.status(201).json(essence);
    } catch (error: any) {
      console.error('Error creating essence:', error);
      
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Essence with this name already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateEssenceDTO = req.body;
      
      if (!data.name || data.name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
      }

      const essence = await essencesService.update(id, data);
      res.json(essence);
    } catch (error: any) {
      console.error('Error updating essence:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Essence not found' });
      }
      
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Essence with this name already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await essencesService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting essence:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Essence not found' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}