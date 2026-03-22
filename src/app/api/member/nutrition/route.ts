import { NextResponse, NextRequest } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { prisma } from '@/backend/shared/prisma'
import { generateWeeklyDietPlan } from '@/lib/ai-nutritionist'

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
    
    // 1. Update or create the profile
    const profile = await prisma.nutritionProfile.upsert({
      where: { memberId: auth.user.id },
      update: {
        age: parseInt(data.age),
        weight: parseFloat(data.weight),
        height: parseFloat(data.height),
        fitnessGoal: data.fitnessGoal,
        activityLevel: data.activityLevel,
        dietaryPreference: data.dietaryPreference,
        cuisinePreference: data.cuisinePreference,
        usualDiet: data.usualDiet,
        allergies: data.allergies || [],
        restrictions: data.restrictions || [],
        completed: true
      },
      create: {
        memberId: auth.user.id,
        age: parseInt(data.age),
        weight: parseFloat(data.weight),
        height: parseFloat(data.height),
        fitnessGoal: data.fitnessGoal,
        activityLevel: data.activityLevel,
        dietaryPreference: data.dietaryPreference,
        cuisinePreference: data.cuisinePreference,
        usualDiet: data.usualDiet,
        allergies: data.allergies || [],
        restrictions: data.restrictions || [],
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
    // (We'll store them for the next 7 days starting today)
    const today = new Date()
    for (let i = 0; i < aiResponse.weeklyPlan.length; i++) {
      const dayData = aiResponse.weeklyPlan[i]
      const planDate = new Date(today)
      planDate.setDate(today.getDate() + i)

      await prisma.mealPlan.create({
        data: {
          memberId: auth.user.id,
          date: planDate,
          totalCalories: dayData.meals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0),
          totalProtein: dayData.meals.reduce((sum: number, m: any) => sum + (m.protein || 0), 0),
          meals: {
            create: dayData.meals.map((meal: any) => ({
              time: meal.time,
              description: meal.description,
              calories: meal.calories,
              protein: meal.protein
            }))
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
