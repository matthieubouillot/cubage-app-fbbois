import { Request, Response } from 'express';
import { ScieursService, CreateScieurDTO, UpdateScieurDTO } from './scieurs.service';

const scieursService = new ScieursService();

export class ScieursController {
  async findAll(req: Request, res: Response) {
    try {
      const scieurs = await scieursService.findAll();
      res.json(scieurs);
    } catch (error) {
      console.error('Error fetching scieurs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const scieur = await scieursService.findById(id);
      
      if (!scieur) {
        return res.status(404).json({ error: 'Scieur not found' });
      }
      
      res.json(scieur);
    } catch (error) {
      console.error('Error fetching scieur:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data: CreateScieurDTO = req.body;
      
      if (!data.name || data.name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
      }

      const scieur = await scieursService.create(data);
      res.status(201).json(scieur);
    } catch (error: any) {
      console.error('Error creating scieur:', error);
      
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Scieur with this name already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateScieurDTO = req.body;
      
      if (!data.name || data.name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
      }

      const scieur = await scieursService.update(id, data);
      res.json(scieur);
    } catch (error: any) {
      console.error('Error updating scieur:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Scieur not found' });
      }
      
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Scieur with this name already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await scieursService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting scieur:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Scieur not found' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
