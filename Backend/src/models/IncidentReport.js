import mongoose from 'mongoose';

const IncidentReportSchema = new mongoose.Schema(
  {
    mediaUrl: { type: String, required: true },
    category: {
      type: String,
      enum: ['crack', 'slope_movement', 'road_blocked', 'bridge_damage'],
      required: true,
      index: true
    },
    severityObserved: {
      type: String,
      enum: ['minor', 'severe', 'critical'],
      default: 'severe'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      coordinates: {
        type: [Number], // [lng, lat] GeoJSON format
        required: true
      }
    },
    description: { type: String, trim: true },
    agentEvaluated: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

IncidentReportSchema.index({ location: '2dsphere' });

export const IncidentReport = mongoose.models.IncidentReport || mongoose.model('IncidentReport', IncidentReportSchema);
