import mongoose from 'mongoose';

const SimulationSchema = new mongoose.Schema(
  {
    basinName: { type: String, required: true },
    rainfallRateMmPerHour: { type: Number, required: true },
    simulatedDurationHours: { type: Number, default: 3 },
    epicenter: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    calculatedTiers: [
      {
        tierName: String,
        radiusMeters: Number,
        radiusKm: Number,
        strokeColor: String,
        fillColor: String,
        evacuationMandated: Boolean
      }
    ],
    severedRoads: [String],
    vulnerableVillages: [String],
    broadcastEmitted: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Simulation = mongoose.models.Simulation || mongoose.model('Simulation', SimulationSchema);
