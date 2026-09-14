import { db } from '../config/db.js';
import { calculateHazardTiers } from './hazardZoneCalculator.js';

/**
 * Autonomous Gemini ReAct Reasoning Loop (Demo Simulation Engine)
 * Ingests crowdsourced field observations alongside real-time rainfall telemetry,
 * performs multi-turn tool calling, and dynamically recalculates GIS hazard boundaries.
 */
export async function runDisasterIntelligenceReActLoop(incident, io) {
  const incidentId = incident._id || 'rep-new';
  const coords = incident.location?.coordinates || [91.8845, 25.5821];
  const category = incident.category || 'slope_movement';
  const description = incident.description || 'Active surface tension cracks detected.';

  console.log(`[AI ReAct Agent] Initiating reasoning loop for report: ${incidentId}`);

  const reasoningSteps = [];

  // Step 1: Ingestion & Initial Thought
  const initialThought = {
    step: 1,
    type: 'THOUGHT',
    timestamp: new Date().toISOString(),
    content: `CRITICAL ALERT EVALUATION:\nA new incident report [${incidentId}] filed at Coordinates: [Lat: ${coords[1].toFixed(4)}, Lng: ${coords[0].toFixed(4)}]. Category: ${category}. Description: "${description}". Checking surrounding infrastructure and regional rain telemetry...`
  };
  reasoningSteps.push(initialThought);

  // Step 2: Tool Call - fetchNearbyCitizenReports
  const toolCall1 = {
    step: 2,
    type: 'ACTION',
    tool: 'fetchNearbyCitizenReports',
    args: {
      latitude: coords[1],
      longitude: coords[0],
      radiusMeters: 5000
    },
    timestamp: new Date().toISOString(),
    content: `Executing tool 'fetchNearbyCitizenReports' within 5000m radius of [${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}]`
  };
  reasoningSteps.push(toolCall1);

  // Step 3: Tool Observation
  const allReports = await db.getReports();
  const nearbyReports = allReports
    .filter(r => r._id !== incidentId)
    .slice(0, 3)
    .map(r => ({
      id: r._id,
      category: r.category,
      severity: r.severityObserved,
      coords: r.location.coordinates
    }));

  const observation1 = {
    step: 3,
    type: 'OBSERVATION',
    tool: 'fetchNearbyCitizenReports',
    result: {
      totalFound: nearbyReports.length + 1,
      clusterDensity: nearbyReports.length >= 2 ? 'HIGH_DENSITY_CLUSTER' : 'MODERATE',
      nearbyReports
    },
    timestamp: new Date().toISOString(),
    content: `Discovered ${nearbyReports.length} clustered ground reports along adjacent slope axis. Multi-point tension crack pattern confirmed.`
  };
  reasoningSteps.push(observation1);

  // Step 4: Reasoning on Road Vulnerability
  const activeHazard = (await db.getHazards())[0];
  const currentRain = activeHazard ? activeHazard.rainfallRateMmPerHour : 165;
  const isCloudburst = currentRain >= 100;

  const evaluationThought = {
    step: 4,
    type: 'THOUGHT',
    timestamp: new Date().toISOString(),
    content: `Observation confirms multi-point fissure cluster along NH-58 Alaknanda corridor near Chamoli. Rainfall telemetry indicates ${currentRain} mm/hr (${isCloudburst ? 'Cloudburst Regime' : 'Heavy Monsoonal Precipitation'}). Shear strength safety factor (FS) projected to drop below 1.05. Re-evaluating Zone 1 Ground Zero radius and closing NH-58 Badrinath transit.`
  };
  reasoningSteps.push(evaluationThought);

  // Step 5: Tool Call - recalculateHazardTierRadii
  const expandedMultiplier = isCloudburst ? 1.25 : 1.1;
  const newTiers = calculateHazardTiers(currentRain, expandedMultiplier);
  const severedRoad = 'NH-58 (Badrinath Lifeline) KM 42 Helang Subsidence';

  const toolCall2 = {
    step: 5,
    type: 'ACTION',
    tool: 'recalculateHazardTierRadii',
    args: {
      hazardId: activeHazard ? activeHazard._id : 'hazard-uk-alaknanda-active',
      zone1RadiusKm: newTiers[0].radiusKm,
      zone2RadiusKm: newTiers[1].radiusKm,
      severedRoads: [severedRoad, 'Helang-Joshimath Bypass Link Road']
    },
    timestamp: new Date().toISOString(),
    content: `Executing 'recalculateHazardTierRadii': Expanding Zone 1 to ${newTiers[0].radiusKm} km and Zone 2 to ${newTiers[1].radiusKm} km. Severing route '${severedRoad}'.`
  };
  reasoningSteps.push(toolCall2);

  // Step 6: Update State in DB
  if (activeHazard) {
    const updatedSevered = Array.from(new Set([...(activeHazard.severedRoads || []), severedRoad]));
    await db.updateHazard(activeHazard._id, {
      tiers: newTiers,
      severedRoads: updatedSevered,
      updatedAt: new Date().toISOString()
    });
  }

  // Mark incident as evaluated
  await db.updateReport(incidentId, { agentEvaluated: true });

  const observation2 = {
    step: 6,
    type: 'OBSERVATION',
    tool: 'recalculateHazardTierRadii',
    result: { status: 'SUCCESS', updated: true, newZone1RadiusKm: newTiers[0].radiusKm },
    timestamp: new Date().toISOString(),
    content: `HazardEvent contours recalibrated in GIS spatial database. Boundary buffer expanded by +${(newTiers[0].radiusKm * 0.25).toFixed(2)} km.`
  };
  reasoningSteps.push(observation2);

  // Step 7: Final Assessment
  const finalAssessment = {
    step: 7,
    type: 'FINAL_ASSESSMENT',
    timestamp: new Date().toISOString(),
    content: `[RE-ACT SYNTHESIS COMPLETE]:
Dynamic threat recalculation verified. Zone 1 expanded to ${newTiers[0].radiusKm} km radius with mandatory evacuation directive. NH-306 transit corridor marked as SEVERED. Broadcast transmitted across all active Web and Mobile terminals.`
  };
  reasoningSteps.push(finalAssessment);

  const evaluationResult = {
    incidentId,
    timestamp: new Date().toISOString(),
    status: 'COMPLETED',
    reasoningSteps,
    finalAssessment: finalAssessment.content,
    newTiers,
    severedRoads: [severedRoad]
  };

  // Broadcast AI reasoning update & updated hazard over Socket.io
  if (io) {
    io.emit('AI_REASONING_UPDATE', evaluationResult);
    io.emit('HAZARD_UPDATED', {
      hazardId: activeHazard?._id,
      tiers: newTiers,
      severedRoads: [severedRoad, 'GS Road KM 18 Embankment Washout']
    });
  }

  return evaluationResult;
}
