import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PlanProgressCardProps {
  member: any;
  planProgress: number;
}

export function PlanProgressCard({ member, planProgress }: PlanProgressCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Plan Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Sessions Used</span>
            <span className="font-medium">{30 - member.sessionsRemaining}/30</span>
          </div>
          <Progress value={((30 - member.sessionsRemaining) / 30) * 100} />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Plan Duration</span>
            <span className="font-medium">{planProgress}%</span>
          </div>
          <Progress value={planProgress} />
        </div>
      </CardContent>
    </Card>
  );
}
