import mongoose from 'mongoose';

const RiskTierSchema = new mongoose.Schema({
  tierName: {
    type: String,
    enum: ['Hard Most', 'Most', 'Some', 'Negligible'],
    required: true
  },
  radiusMeters: { type: Number, required: true },
  strokeColor: { type: String, required: true },
  fillColor: { type: String, required: true },
  fillOpacity: { type: Number, required: true },
  evacuationMandated: { type: Boolean, default: false },
  description: { type: String }
});

const HazardEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    simulatedBasin: { type: String, required: true, index: true },
    rainfallRateMmPerHour: { type: Number, required: true },
    status: {
      type: String,
      enum: ['active', 'resolved'],
      default: 'active',
      index: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true
      }
    },
    tiers: [RiskTierSchema],
    severedRoads: [{ type: String }],
    vulnerableVillages: [{ type: String }]
  },
  { timestamps: true }
);

HazardEventSchema.index({ location: '2dsphere' });

export const HazardEvent = mongoose.models.HazardEvent || mongoose.model('HazardEvent', HazardEventSchema);
