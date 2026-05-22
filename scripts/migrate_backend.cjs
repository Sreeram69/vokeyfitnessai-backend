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

  // 2. Create the backend route content
  const routeContent = `const express = require('express');
const router = express.Router();

${planData}

// @route   GET /api/plans
// @desc    Get all workout plans
// @access  Public
router.get('/', (req, res) => {
  res.json(workoutPlans);
});

// @route   GET /api/plans/:id
// @desc    Get single workout plan
// @access  Public
router.get('/:id', (req, res) => {
  const plan = workoutPlans.find(p => p.id === req.params.id);
  if (plan) {
    res.json(plan);
  } else {
    res.status(404).json({ message: 'Plan not found' });
  }
});

module.exports = router;
`;

  // Write to backend routes
  fs.writeFileSync(backendPlanRouteFile, routeContent);
  console.log('Successfully created backend plan route.');

  // 3. Update server.js to use the new route
  let serverCode = fs.readFileSync(backendServerFile, 'utf8');
  
  if (!serverCode.includes('./routes/planRoutes')) {
    // Inject route import
    const routeImportStr = `const planRoutes = require('./routes/planRoutes');\n`;
    const routeUseStr = `app.use('/api/plans', planRoutes);\n`;

    if (serverCode.includes('const app = express();')) {
      serverCode = serverCode.replace(
        'const app = express();',
        `const app = express();\n${routeImportStr}`
      );
      
      if (serverCode.includes('app.use(express.json());')) {
        serverCode = serverCode.replace(
          'app.use(express.json());',
          `app.use(express.json());\n${routeUseStr}`
        );
      } else {
        serverCode = serverCode.replace(
          `app.listen(`,
          `${routeUseStr}\napp.listen(`
        );
      }
      
      fs.writeFileSync(backendServerFile, serverCode);
      console.log('Successfully updated backend server.js with plan route.');
    } else {
      console.error('Could not find express init in server.js');
    }
  } else {
    console.log('Backend server.js already has planRoutes.');
  }

  // 4. Delete the client data file
  fs.unlinkSync(clientDataPath);
  console.log('Successfully deleted client workoutPlans.js');

} catch (err) {
  console.error('Migration failed:', err);
}
