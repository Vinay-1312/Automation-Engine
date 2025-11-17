import api from './api';
import { Rule } from '../types/Rule';

export const RulesService = {
  createRule: async (rule: Rule) => {
    const response = await api.post('/automations', rule);
    return response.data;
  },

  getRules: async () => {
    const response = await api.get('/automations');
    return response.data;
  },

  getRule: async (id: string) => {
    const response = await api.get(`/automations/${id}`);
    return response.data;
  },

  updateRule: async (id: string, rule: Rule) => {
    const response = await api.put(`/automations/${id}`, rule);
    return response.data;
  },

  deleteRule: async (id: string) => {
    const response = await api.delete(`/automations/${id}`);
    return response.data;
  }
};