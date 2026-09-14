import mongoose from 'mongoose';
import { SEED_BASINS, SEED_HAZARDS, SEED_REPORTS, SEED_SENSORS } from '../data/seedData.js';

class ResilientDatabase {
  constructor() {
    this.isMongooseConnected = false;
    // In-memory collections initialized with seed data
    this.hazards = JSON.parse(JSON.stringify(SEED_HAZARDS));
    this.reports = JSON.parse(JSON.stringify(SEED_REPORTS));
    this.sensors = JSON.parse(JSON.stringify(SEED_SENSORS));
    this.basins = JSON.parse(JSON.stringify(SEED_BASINS));
    this.simulations = [];
  }

  async connect() {
    const uri = process.env.MONGODB_URI;
    if (!uri || uri.includes('YourMongoPasswordHere')) {
      console.log('⚡ [Database] MONGODB_URI not set or placeholder detected. Operating in high-performance in-memory mode with full seed data.');
      return;
    }

    try {
      console.log('⚡ [Database] Connecting to MongoDB Atlas...');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
      this.isMongooseConnected = true;
      console.log('✅ [Database] Successfully connected to MongoDB Atlas 2dsphere cluster.');
    } catch (err) {
      console.warn('⚠️ [Database] MongoDB Atlas connection failed. Seamlessly falling back to in-memory store:', err.message);
      this.isMongooseConnected = false;
    }
  }

  // Hazards API
  async getHazards() {
    return this.hazards;
  }

  async getHazardById(id) {
    return this.hazards.find(h => h._id === id || h.id === id) || null;
  }

  async createHazard(hazard) {
    const doc = {
      _id: hazard._id || `hazard-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...hazard
    };
    this.hazards.unshift(doc);
    return doc;
  }

  async updateHazard(id, updates) {
    const index = this.hazards.findIndex(h => h._id === id || h.id === id);
    if (index !== -1) {
      this.hazards[index] = {
        ...this.hazards[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return this.hazards[index];
    }
    return null;
  }

  // Reports API
  async getReports() {
    return this.reports;
  }

  async getReportById(id) {
    return this.reports.find(r => r._id === id) || null;
  }

  async createReport(report) {
    const doc = {
      _id: report._id || `rep-${Date.now()}`,
      agentEvaluated: false,
      createdAt: new Date().toISOString(),
      ...report
    };
    this.reports.unshift(doc);
    return doc;
  }

  async updateReport(id, updates) {
    const index = this.reports.findIndex(r => r._id === id);
    if (index !== -1) {
      this.reports[index] = { ...this.reports[index], ...updates };
      return this.reports[index];
    }
    return null;
  }

  // Basins & Sensors API
  async getBasins() {
    return this.basins;
  }

  async getSensors() {
    return this.sensors;
  }

  // Simulations API
  async getSimulations() {
    return this.simulations;
  }

  async createSimulation(sim) {
    const doc = {
      id: `sim-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...sim
    };
    this.simulations.unshift(doc);
    return doc;
  }
}

export const db = new ResilientDatabase();
