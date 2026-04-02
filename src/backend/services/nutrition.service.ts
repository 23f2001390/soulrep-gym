import { prisma } from '../shared/prisma'
import { generateWeeklyDietPlan } from '@/lib/ai-nutritionist'

const GEMINI_TIMEOUT_MS = 60000

export async function getNutritionProfile(memberId: string) {
  const profile = await prisma.nutritionProfile.findUnique({
    where: { memberId },
  })

  const mealPlans = await prisma.mealPlan.findMany({
    where: { memberId },
    orderBy: { date: 'desc' },
    take: 7,
    include: { meals: true }
  })

  return { profile, mealPlans }
}

export async function generateAndSaveDietPlan(memberId: string, data: any) {
  // 1. Update or create the profile
  const profile = await prisma.nutritionProfile.upsert({
    where: { memberId },
    update: {
      age: data.age,
      weight: data.weight,
      height: data.height,
      fitnessGoal: data.fitnessGoal,
      activityLevel: data.activityLevel,
      dietaryPreference: data.dietaryPreference,
      cuisinePreference: data.cuisinePreference,
      usualDiet: data.usualDiet,
      allergies: data.allergies,
      restrictions: data.restrictions,
      completed: true
    },
    create: {
      memberId,
      age: data.age,
      weight: data.weight,
      height: data.height,
      fitnessGoal: data.fitnessGoal,
      activityLevel: data.activityLevel,
      dietaryPreference: data.dietaryPreference,
      cuisinePreference: data.cuisinePreference,
      usualDiet: data.usualDiet,
      allergies: data.allergies,
      restrictions: data.restrictions,
      completed: true
    }
  })

  // 2. Call Gemini for the weekly plan with timeout protection
  console.log('[nutrition-api] Initiating AI diet plan generation...')
  const aiResponse: any = await Promise.race([
    generateWeeklyDietPlan(profile),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`AI generation timed out after ${GEMINI_TIMEOUT_MS / 1000}s.`)), GEMINI_TIMEOUT_MS)
    }),
  ])

  // 3. Update profile with calculated targets
  await prisma.nutritionProfile.update({
    where: { id: profile.id },
    data: {
      targetCalories: aiResponse.targets.calories,
      targetProtein: aiResponse.targets.protein,
      targetCarbs: aiResponse.targets.carbs,
      targetFat: aiResponse.targets.fat,
    }
  })

  // 4. Save the weekly plan to MealPlan table
  const today = new Date()
  await prisma.mealPlan.deleteMany({
    where: { memberId }
  })

  for (let i = 0; i < aiResponse.weeklyPlan.length; i++) {
    const dayData = aiResponse.weeklyPlan[i]
    const planDate = new Date(today)
    planDate.setDate(today.getDate() + i)
    
    const meals = dayData.meals.map((meal: any) => {
      let type: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" = "SNACK";
      const mealName = (meal.time || "").toUpperCase();
      if (mealName.includes("BREAKFAST")) type = "BREAKFAST";
      else if (mealName.includes("LUNCH")) type = "LUNCH";
      else if (mealName.includes("DINNER")) type = "DINNER";

      return {
        type,
        name: meal.name || meal.description.substring(0, 50),
        description: meal.description,
        calories: Math.round(meal.calories || 0),
        protein: Math.round(meal.protein || 0),
        carbs: Math.round(meal.carbs || 0),
        fat: Math.round(meal.fat || 0),
        completed: false
      }
    })

    await prisma.mealPlan.create({
      data: {
        memberId,
        date: planDate,
        totalCalories: meals.reduce((sum: number, m: any) => sum + m.calories, 0),
        totalProtein: meals.reduce((sum: number, m: any) => sum + m.protein, 0),
        totalCarbs: meals.reduce((sum: number, m: any) => sum + m.carbs, 0),
        totalFat: meals.reduce((sum: number, m: any) => sum + m.fat, 0),
        meals: {
          create: meals
        }
      }
    })
  }

  console.log('[nutrition-api] Plan generation successful')
  return {
    success: true,
    message: "Your personalized AI plan has been generated!",
    supplement: aiResponse.supplementRecommendation
  }
}
