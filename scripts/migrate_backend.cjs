const fs = require('fs');
const path = require('path');

const clientDataPath = path.join(__dirname, '../src/data/workoutPlans.js');
const backendRoutesDir = 'c:\\Users\\Sreeram\\vokeyfitness-backend\\routes';
const backendServerFile = 'c:\\Users\\Sreeram\\vokeyfitness-backend\\server.js';
const backendPlanRouteFile = path.join(backendRoutesDir, 'planRoutes.js');

try {
  // 1. Read workout plans from client
  const clientData = fs.readFileSync(clientDataPath, 'utf8');
  
  // Transform from ES module export to CommonJS, assuming backend is CommonJS
  // The client file has: export const workoutPlans = [ ... ];
  const planData = clientData.replace('export const workoutPlans =', 'const workoutPlans =');
