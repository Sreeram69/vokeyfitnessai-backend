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

  // First let's check if we can just string replace "Sunday: Recovery" to "Sunday: Home Workout" and that's enough for the UI to say "Home Workout".
  // The exercises list doesn't strictly need to be in the "plan.exercises" array for the Custom Plan to show it, because Custom Plan is built by the user.
  // But for the Active Workout page, it looks at plan.exercises.
  
  // Let's just define a standard string to append to every `exercises: [`
  const homeWorkoutExercises = `
      { id: "home-01", name: "Bodyweight Squat", sets: "3", reps: "15" },
      { id: "home-02", name: "Push-ups", sets: "3", reps: "15" },
      { id: "home-03", name: "Plank", sets: "3", reps: "60s" },
      { id: "home-04", name: "Jumping Jacks", sets: "3", reps: "30" },`;

  // We can replace `exercises: [` with `exercises: [ ${homeWorkoutExercises}`
  // to add them to all plans!
  if (!content.includes('"home-01"')) {
    content = content.replace(/exercises: \[/g, `exercises: [${homeWorkoutExercises}`);
  }

  fs.writeFileSync(backendPlanRouteFile, content);
  console.log('Successfully updated planRoutes.js with Home Workouts.');
} catch (err) {
  console.error('Failed to update planRoutes.js:', err);
}
