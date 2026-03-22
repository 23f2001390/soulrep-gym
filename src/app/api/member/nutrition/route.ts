import { NextResponse, NextRequest } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { prisma } from '@/backend/shared/prisma'
import { generateWeeklyDietPlan } from '@/lib/ai-nutritionist'

function parseNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number.parseInt(String(value), 10)
  return Number.isFinite(parsed) ? parsed : null
}

function parseNullableFloat(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number.parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : null
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

// GET: Fetch current nutrition profile and plans
export async function GET(req: NextRequest) {
  const auth = await authenticate(['MEMBER'])
  if (auth.error) return auth.error

  const profile = await prisma.nutritionProfile.findUnique({
    where: { memberId: auth.user.id },
  })

  // Also fetch the most recent meal plans
  const mealPlans = await prisma.mealPlan.findMany({
    where: { memberId: auth.user.id },
    orderBy: { date: 'desc' },
    take: 7,
    include: { meals: true }
  })

  return NextResponse.json({ profile, mealPlans })
}

// POST: Update profile and trigger AI generation
export async function POST(req: NextRequest) {
  const auth = await authenticate(['MEMBER'])
  if (auth.error) return auth.error

  try {
    const data = await req.json()
    const age = parseNullableInt(data.age)
    const weight = parseNullableFloat(data.weight)
    const height = parseNullableFloat(data.height)
    const allergies = parseStringArray(data.allergies)
    const restrictions = parseStringArray(data.restrictions)
    
    // 1. Update or create the profile
    const profile = await prisma.nutritionProfile.upsert({
      where: { memberId: auth.user.id },
      update: {
        age,
        weight,
        height,
        fitnessGoal: data.fitnessGoal,
        activityLevel: data.activityLevel,
        dietaryPreference: data.dietaryPreference,
        cuisinePreference: data.cuisinePreference,
        usualDiet: data.usualDiet,
        allergies,
        restrictions,
        completed: true
      },
      create: {
        memberId: auth.user.id,
        age,
        weight,
        height,
        fitnessGoal: data.fitnessGoal,
        activityLevel: data.activityLevel,
        dietaryPreference: data.dietaryPreference,
        cuisinePreference: data.cuisinePreference,
        usualDiet: data.usualDiet,
        allergies,
        restrictions,
        completed: true
      }
    })

    // 2. Call Gemini for the weekly plan
    const aiResponse = await generateWeeklyDietPlan(profile)

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
    // Reset any previous plans to avoid duplicates for the next 7 days
    await prisma.mealPlan.deleteMany({
      where: { memberId: auth.user.id }
    })

    for (let i = 0; i < aiResponse.weeklyPlan.length; i++) {
      const dayData = aiResponse.weeklyPlan[i]
      const planDate = new Date(today)
      planDate.setDate(today.getDate() + i)
      const meals = dayData.meals.map((meal) => {
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
          memberId: auth.user.id,
          date: planDate,
          totalCalories: meals.reduce((sum, meal) => sum + meal.calories, 0),
          totalProtein: meals.reduce((sum, meal) => sum + meal.protein, 0),
          totalCarbs: meals.reduce((sum, meal) => sum + meal.carbs, 0),
          totalFat: meals.reduce((sum, meal) => sum + meal.fat, 0),
          meals: {
            create: meals
          }
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Plan generated successfully!",
      supplement: aiResponse.supplementRecommendation
    })

  } catch (error: any) {
    console.error("Nutrition POST Error:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}
