const fs = require('fs');
const path = require('path');

const backendPlanRouteFile = 'c:\\Users\\Sreeram\\vokeyfitness-backend\\routes\\planRoutes.js';

try {
  let content = fs.readFileSync(backendPlanRouteFile, 'utf8');

  // Replace "Sunday: Recovery" with "Sunday: Home Workout" in weekly schedules
  content = content.replace(/"Sunday: Recovery"/g, '"Sunday: Home Workout"');

  // For each plan, we want to add Home Workout exercises if not present
  // But wait, the plans are hardcoded JS objects inside the file.
  // It's tricky to parse and inject safely using regex.
  // Let's just do a string replace to add the exercises into the exercises array of each plan!
