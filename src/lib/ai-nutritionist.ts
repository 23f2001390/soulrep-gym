import { GoogleGenAI } from "@google/genai";
import { FitnessGoal, ActivityLevel, DietaryPreference } from "@prisma/client";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const auth = process.env.GEMINI_API_KEY ? { apiKey: process.env.GEMINI_API_KEY } : {};
const genai = new GoogleGenAI(auth);

export interface NutritionProfileData {
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  fitnessGoal: FitnessGoal;
  activityLevel: ActivityLevel;
  dietaryPreference: DietaryPreference;
  cuisinePreference?: string | null;
  usualDiet?: string | null;
  allergies: string[];
  restrictions: string[];
}

export async function generateWeeklyDietPlan(profile: NutritionProfileData) {
  const model = genai.getGenerativeModel({
    model: "gemini-3-flash-preview",
  });

  const prompt = `
    You are an expert AI Nutritionist at "SoulRep Gym".
    
    Member Details:
    - Age: ${profile.age || 'Not provided'}
    - Weight: ${profile.weight || 'Not provided'} kg
    - Height: ${profile.height || 'Not provided'} cm
    - Goal: ${profile.fitnessGoal}
    - Activity Level: ${profile.activityLevel}
    - Dietary Preference: ${profile.dietaryPreference}
    - Cuisine Preference: ${profile.cuisinePreference || 'General'}
    - Usual Diet: ${profile.usualDiet || 'Not provided'}
    - Allergies: ${profile.allergies.join(", ") || 'None'}
    - Restrictions: ${profile.restrictions.join(", ") || 'None'}

    Task:
    1. Calculate Daily Macros: Calories, Protein (1.8g to 2.2g per kg if muscle gain, 1.2g to 1.5g for maintenance), Carbs, and Fats.
    2. Recommend Protein Powder: Indicate if they should use whey/plant protein based on their weight and goal.
    3. Generate a 7-day Weekly Diet Plan (Monday-Sunday) matching their cuisine preference (${profile.cuisinePreference}).
    
    Response Format (Strictly valid JSON):
    {
      "targets": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      },
      "supplementRecommendation": "string",
      "weeklyPlan": [
        {
          "day": "Monday",
          "meals": [
            { "time": "Breakfast", "description": "...", "protein": number, "calories": number },
            { "time": "Lunch", "description": "...", "protein": number, "calories": number },
            { "time": "Snack", "description": "...", "protein": number, "calories": number },
            { "time": "Dinner", "description": "...", "protein": number, "calories": number }
          ]
        },
        ... (repeat for all days)
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON from possible markdown wrap
    const cleanJson = text.replace(/```json|```/gi, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Nutritionist Error:", error);
    throw new Error("Failed to generate diet plan. Please try again later.");
  }
}
