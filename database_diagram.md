# SoulRep Gym Database ER Diagram

This ER diagram is aligned with the current Prisma schema in [schema.prisma](C:/Users/USER/Downloads/fianl/soulrep-gym/prisma/schema.prisma).

```mermaid
erDiagram
    %% Core identity and auth
    User {
        String id PK
        String name
        String email UK
        DateTime emailVerified
        String image
        String password
        Role role
        String phone
        DateTime createdAt
        DateTime updatedAt
    }

    Account {
        String id PK
        String userId FK
        String type
        String provider
        String providerAccountId
        String refresh_token
        String access_token
        Int expires_at
        String token_type
        String scope
        String id_token
        String session_state
    }

    Session {
        String id PK
        String sessionToken UK
        String userId FK
        DateTime expires
    }

    VerificationToken {
        String id PK
        String identifier
        String token UK
        DateTime expires
    }

    Notification {
        String id PK
        String userId FK
        String title
        String message
        Boolean read
        DateTime createdAt
    }

    %% People domain
    Member {
        String id PK_FK
        DateTime joinDate
        PlanType plan
        DateTime planExpiry
        PlanStatus planStatus
        String trainerId FK
        String healthNotes
        Int attendanceCount
        Int sessionsRemaining
        Int age
        Gender gender
    }

    Trainer {
        String id PK_FK
        String specialization
        Float rating
        Int reviewCount
        Int memberCount
        Availability availability
        Json schedule
    }

    AttendanceRecord {
        String id PK
        String memberId FK
        DateTime date
        DateTime checkIn
        DateTime checkOut
        Method method
    }

    Invoice {
        String id PK
        String memberId FK
        PlanType plan
        Int amount
        DateTime date
        InvoiceStatus status
        DateTime createdAt
    }

    Booking {
        String id PK
        String memberId FK
        String trainerId FK
        DateTime date
        String time
        BookingStatus status
        DateTime createdAt
    }

    Review {
        String id PK
        String trainerId FK
        String memberId FK
        Int rating
        String feedback
        DateTime date
    }

    %% Workout domain
    WorkoutPlan {
        String id PK
        String memberId FK
        String trainerId FK
        String day
        String notes
        DateTime createdAt
    }

    Exercise {
        String id PK
        String workoutPlanId FK
        String name
        Int sets
        String reps
        String rest
        String notes
    }

    SessionLog {
        String id PK
        String memberId FK
        String trainerId FK
        DateTime date
        Int duration
        StringArray exercises
        String notes
        Boolean completed
        DateTime createdAt
    }

    %% Nutrition domain
    NutritionProfile {
        String id PK
        String memberId FK_UK
        Int age
        Float weight
        Float height
        FitnessGoal fitnessGoal
        ActivityLevel activityLevel
        DietaryPreference dietaryPreference
        String cuisinePreference
        String usualDiet
        StringArray allergies
        StringArray restrictions
        Int targetCalories
        Float targetProtein
        Float targetCarbs
        Float targetFat
        Boolean completed
        DateTime createdAt
        DateTime updatedAt
    }

    MealPlan {
        String id PK
        String memberId FK
        DateTime date
        Int totalCalories
        Int totalProtein
        Int totalCarbs
        Int totalFat
    }

    Meal {
        String id PK
        String mealPlanId FK
        MealType type
        String name
        String description
        Int calories
        Int protein
        Int carbs
        Int fat
        Boolean completed
    }

    %% Equipment domain
    Equipment {
        String id PK
        String name
        String category
        String status
        DateTime lastMaintenance
        DateTime nextMaintenance
        DateTime purchaseDate
        DateTime createdAt
        DateTime updatedAt
    }

    MaintenanceRecord {
        String id PK
        String equipmentId FK
        DateTime date
        String type
        String description
        Float cost
        String performedBy
    }

    %% Relationships
    %% Composite unique constraints in Prisma:
    %% Account(provider, providerAccountId)
    %% VerificationToken(identifier, token)
    User ||--o| Member : has_profile
    User ||--o| Trainer : has_profile
    User ||--o{ Account : owns
    User ||--o{ Session : has
    User ||--o{ Notification : receives

    Trainer ||--o{ Member : trains
    Trainer ||--o{ WorkoutPlan : creates
    Trainer ||--o{ SessionLog : conducts
    Trainer ||--o{ Review : receives
    Trainer ||--o{ Booking : assigned_to

    Member ||--o{ AttendanceRecord : has
    Member ||--o{ Invoice : billed
    Member ||--o{ WorkoutPlan : follows
    Member ||--o{ SessionLog : logs
    Member ||--o{ Review : writes
    Member ||--o{ Booking : makes
    Member ||--o| NutritionProfile : has
    Member ||--o{ MealPlan : receives

    WorkoutPlan ||--o{ Exercise : contains
    MealPlan ||--o{ Meal : includes
    Equipment ||--o{ MaintenanceRecord : has
```
