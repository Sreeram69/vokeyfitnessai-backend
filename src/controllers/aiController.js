const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const AIHistory = require("../models/AIHistory");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// @desc    Analyze food nutritional profile
// @route   POST /api/ai/analyze-food
// @access  Protected/Private
const analyzeFood = async (req, res, next) => {
  try {
    const { foodQuery } = req.body;
    let nutritionData = null;
    let fallbackUsed = false;

    // Try analyzing with Gemini API
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Define the schema for the JSON response
        const schema = {
          type: SchemaType.OBJECT,
          properties: {
            foodName: {
              type: SchemaType.STRING,
              description: "A normalized, clean name for the food queried",
            },
            calories: {
              type: SchemaType.INTEGER,
              description: "Total estimated calories",
            },
            protein: {
              type: SchemaType.INTEGER,
              description: "Total protein in grams",
            },
            carbs: {
              type: SchemaType.INTEGER,
              description: "Total carbohydrates in grams",
            },
            fats: {
              type: SchemaType.INTEGER,
              description: "Total fat in grams",
            },
          },
          required: ["foodName", "calories", "protein", "carbs", "fats"],
        };

        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        });

        const prompt = `Analyze the following food item or meal and provide its nutritional breakdown (calories, protein, carbs, fats) for a standard serving size. If the user provided a quantity, account for it. Be as accurate as possible based on standard nutritional databases. Food query: "${foodQuery}"`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        nutritionData = JSON.parse(responseText);

        // Success: Directly persist the analyzed meal to our food database (preventing duplicates internally)
        const NutritionService = require("../services/NutritionService");
        await NutritionService.addFood({
          name: nutritionData.foodName,
          servingSize: "1 serving",
          calories: nutritionData.calories,
          protein: nutritionData.protein,
          carbs: nutritionData.carbs,
          fats: nutritionData.fats
        });
      } catch (geminiErr) {
        console.warn("⚠️ Gemini API food analysis failed. Trying local database fallback...", geminiErr.message);
      }
    }

    // Fallback: If Gemini failed or was unconfigured, look up in our database using smart matching
    if (!nutritionData) {
      const NutritionService = require("../services/NutritionService");
      const bestMatch = await NutritionService.findFallbackMatch(foodQuery);
      if (bestMatch) {
        nutritionData = {
          foodName: bestMatch.name,
          calories: bestMatch.calories,
          protein: bestMatch.protein,
          carbs: bestMatch.carbs,
          fats: bestMatch.fats
        };
        fallbackUsed = true;
      }
    }

    // If still no data, throw config error or fallback error
    if (!nutritionData) {
      return sendError(
        res,
        "AI Analysis failed and no matching food items found in database.",
        "AI_ANALYSIS_FAILED",
        500
      );
    }

    // Save to AI History if user is logged in
    if (req.user) {
      await AIHistory.create({
        userId: req.user._id,
        type: fallbackUsed ? "meal_analysis_fallback" : "meal_analysis",
        prompt: foodQuery,
        response: nutritionData
      });
    }

    return sendSuccess(res, fallbackUsed ? "Food resolved from local database successfully" : "Food nutritional breakdown analyzed successfully", nutritionData);
  } catch (error) {
    next(error);
  }
};

// @desc    Suggest custom workout routine
// @route   POST /api/ai/workout-plan
// @access  Protected/Private
const suggestWorkoutPlan = async (req, res, next) => {
  try {
    const { age, gender, weight, height, goal, targetWeight, activityLevel, experienceLevel, injuries } = req.body;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return sendError(res, "Gemini API Key is missing or invalid on the server.", "API_CONFIG_ERROR", 500);
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const schema = {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: "A unique string ID, e.g., 'ai_custom_plan'" },
        title: { type: SchemaType.STRING, description: "A catchy title for the plan" },
        level: { type: SchemaType.STRING, description: "Beginner, Intermediate, or Advanced" },
        goal: { type: SchemaType.STRING, description: "Primary goal (e.g., Muscle Gain, Fat Loss)" },
        duration: { type: SchemaType.STRING, description: "Duration string (e.g., '8 Weeks')" },
        calories: { type: SchemaType.STRING, description: "Estimated daily calories string (e.g., '2500 kcal/day')" },
        split: { type: SchemaType.STRING, description: "The workout split (e.g., 'Push/Pull/Legs')" },
        weeklySchedule: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Exactly 7 strings, one for each day starting with Monday (e.g., 'Monday: Chest + Triceps')"
        },
        exercises: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              sets: { type: SchemaType.STRING },
              reps: { type: SchemaType.STRING },
              bodyPart: { type: SchemaType.STRING, description: "e.g., chest, back, arms, shoulders, legs, cardio, waist" },
              target: { type: SchemaType.STRING, description: "Specific muscle targeted" },
              equipment: { type: SchemaType.STRING, description: "e.g., dumbbell, barbell, body weight, cable, machine" },
              instructions: { 
                type: SchemaType.ARRAY, 
                items: { type: SchemaType.STRING },
                description: "Step-by-step instructions for the exercise"
              },
              tips: { 
                type: SchemaType.ARRAY, 
                items: { type: SchemaType.STRING },
                description: "Pro tips for form and execution"
              }
            },
            required: ["name", "sets", "reps", "bodyPart", "target", "equipment", "instructions", "tips"]
          },
          description: "A list of 6-10 exercises that make up the core of this plan"
        }
      },
      required: ["id", "title", "level", "goal", "duration", "calories", "split", "weeklySchedule", "exercises"],
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    // RAG/Feedback Loop: Fetch last 5 completed workout sessions for this user to dynamically adjust progression
    let historicalContext = "";
    if (req.user) {
      try {
        const WorkoutSession = require("../models/WorkoutSession");
        const pastSessions = await WorkoutSession.find({
          userId: req.user._id,
          status: "completed"
        }).sort({ endedAt: -1 }).limit(5).lean();

        if (pastSessions && pastSessions.length > 0) {
          historicalContext = "\n\nUser's Recent Training Performance (Feedback Loop):\n";
          pastSessions.forEach((session, index) => {
            historicalContext += `- Session ${index + 1} (${session.category || "General"}): Completed ${session.exercisesCompleted?.length || 0} exercises in ${Math.round(session.duration / 60) || 0} minutes. Estimated calorie burn: ${session.caloriesBurned} kcal.\n`;
            if (session.exercisesCompleted && session.exercisesCompleted.length > 0) {
              historicalContext += `  Exercises logged: ${session.exercisesCompleted.map(ex => `${ex.name} (${ex.sets}x${ex.reps})`).join(", ")}\n`;
            }
          });
          historicalContext += `\nInstructions for Adaptive Volume Adjustment (Progressive Overload vs Deload):\n`;
          historicalContext += `- If the user has completed at least 3 recent sessions successfully with high exercise completion rates, dynamically prescribe PROGRESSIVE OVERLOAD by slightly increasing sets, reps, or recommending a 5-10% weight progression.\n`;
          historicalContext += `- If the user has sparse workouts (e.g. less than 2 completed sessions recently) or low completion rates, prescribe a STABILIZATION or DELOAD phase by keeping volumes moderate and focusing on form/recovery.\n`;
        }
      } catch (err) {
        console.warn("⚠️ Failed to load historical training context for AI, proceeding with profile only:", err.message);
      }
    }

    const prompt = `You are an elite personal trainer. Create a customized workout plan for a user with the following details:
Age: ${age}
Gender: ${gender}
Weight: ${weight}kg
Target Weight: ${targetWeight}kg
Height: ${height}cm
Primary Goal: ${goal}
Activity Level: ${activityLevel}
Experience Level: ${experienceLevel || "Beginner"}
Injuries/Limitations: ${injuries && injuries.length > 0 ? injuries.join(", ") : "None"}${historicalContext}

Please generate a structured JSON response matching the provided schema. The weeklySchedule must have exactly 7 entries starting from Monday. Ensure the exercises are safe and suitable for the given experience level and injuries.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const planData = JSON.parse(responseText);

    // Persist any new exercises to MongoDB Exercise collection
    const Exercise = require("../models/Exercise");
    const ExerciseService = require("../services/ExerciseService");

    if (planData.exercises && Array.isArray(planData.exercises)) {
      for (const newEx of planData.exercises) {
        try {
          const nameLower = newEx.name.toLowerCase().trim();
          const exists = await Exercise.exists({ name: newEx.name });
          if (!exists) {
            const exerciseId = "ex_" + newEx.name.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Math.random().toString(36).substring(2, 5);
            await ExerciseService.addExercise({
              id: exerciseId,
              name: newEx.name,
              bodyPart: newEx.bodyPart || "full body",
              target: newEx.target || "general",
              equipment: newEx.equipment || "body weight",
              difficulty: "Intermediate",
              description: Array.isArray(newEx.tips) ? newEx.tips.join(" ") : "Custom AI generated exercise.",
              instructions: Array.isArray(newEx.instructions) ? newEx.instructions : ["Perform the exercise with proper form."],
              gifUrl: "",
              role: "user"
            });
            console.log(`[AI] Added new exercise to MongoDB: ${newEx.name}`);
          }
        } catch (exErr) {
          console.error(`[AI] Failed to auto-persist custom exercise [${newEx.name}]:`, exErr.message);
        }
      }
    }

    // Save to AI History if user is logged in
    if (req.user) {
      await AIHistory.create({
        userId: req.user._id,
        type: "workout_generation",
        prompt: `Create custom workout for goal: ${goal}`,
        response: planData
      });
    }

    return sendSuccess(res, "Custom workout plan generated successfully", planData);
  } catch (error) {
    next(error);
  }
};

// @desc    Chat with dynamic assistant
// @route   POST /api/ai/chat
// @access  Protected/Private
const chatAssistant = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return sendError(res, "Gemini API Key is missing or invalid on the server.", "API_CONFIG_ERROR", 500);
    }

    // Stateful RAG Context Gathering: Pull user details and daily stats
    let userContext = "";
    if (req.user) {
      try {
        const Activity = require("../models/Activity");
        const WorkoutSession = require("../models/WorkoutSession");
        
        const profile = req.user.profile || {};
        
        const [latestActivity, latestSession] = await Promise.all([
          Activity.findOne({ userId: req.user._id }).sort({ date: -1 }).lean(),
          WorkoutSession.findOne({ userId: req.user._id, status: "completed" }).sort({ endedAt: -1 }).lean()
        ]);

        userContext = `\nAthlete Profile:
- Name: ${profile.name || req.user.username}
- Goal: ${profile.goal || "General Health"}
- Experience: ${profile.experienceLevel || "Beginner"}
- Weight: ${profile.weight || "N/A"} kg
- Height: ${profile.height || "N/A"} cm
- Active Split: ${profile.activePlan?.title || "Custom Split"}`;

        if (latestActivity) {
          userContext += `\nDaily Telemetry (Logged ${new Date(latestActivity.date).toLocaleDateString()}):
- Steps Logged: ${latestActivity.steps} (Target: ${profile.stepTarget || 10000})
- Water Intake: ${latestActivity.waterIntake}L (Target: ${profile.dailyWaterGoal || 3.5}L)
- Active Burned: ${latestActivity.caloriesBurned} kcal
- Distance Walked: ${latestActivity.distance || 0} meters
- Google Heart Points: ${latestActivity.heartPoints || 0}
- Average Heart Rate: ${latestActivity.averageHeartRate ? latestActivity.averageHeartRate + " bpm" : "N/A"}
- Sleep Duration: ${latestActivity.sleepHours ? latestActivity.sleepHours + " hours" : "N/A"}`;
        }

        if (latestSession) {
          userContext += `\nLatest Completed Workout:
- Category: ${latestSession.category || "General"}
- Duration: ${Math.round(latestSession.duration / 60) || 0} mins
- Exercises Logged: ${latestSession.exercisesCompleted?.map(e => e.name).join(", ") || "None"}`;
        }
      } catch (err) {
        console.warn("⚠️ Failed to load user contextual telemetry for AI Chat:", err.message);
      }
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `You are VokeyCoach, an elite personal fitness and nutrition assistant. 
Always leverage the active athlete's physical profile, recent telemetry, and latest logged workout sessions provided below to give hyper-personalized, context-aware, and highly motivational guidance. Keep responses short, motivational, concise, and structured. 
Limit responses to safe suggestions, workout guidance, and nutrition ideas. 
Avoid medical diagnoses or dangerous/extreme recommendations. 

Active Athlete Context:${userContext}

Athlete Message: "${message}"`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text().trim();

    // Store in AI History if user is logged in
    if (req.user) {
      await AIHistory.create({
        userId: req.user._id,
        type: "insight",
        prompt: message,
        response: responseText
      });
    }

    return sendSuccess(res, "Chat response generated successfully", {
      reply: responseText
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeFood,
  suggestWorkoutPlan,
  chatAssistant
};
