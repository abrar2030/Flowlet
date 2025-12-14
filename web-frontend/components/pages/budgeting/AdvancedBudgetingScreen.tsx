import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, PieChart } from "lucide-react";

export default function AdvancedBudgetingScreen() {
  const [budgets] = useState([
    { category: "Groceries", budget: 500, spent: 350, icon: "🛒" },
    { category: "Transportation", budget: 300, spent: 280, icon: "🚗" },
    { category: "Entertainment", budget: 200, spent: 150, icon: "🎬" },
    { category: "Utilities", budget: 400, spent: 400, icon: "⚡" },
    { category: "Dining Out", budget: 250, spent: 180, icon: "🍽️" },
  ]);

  const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const remaining = totalBudget - totalSpent;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Budget Planning</h1>
        <p className="text-muted-foreground">
          Track and manage your spending across categories
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudget.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Monthly allocation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {((totalSpent / totalBudget) * 100).toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${remaining.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((remaining / totalBudget) * 100).toFixed(1)}% left
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Budget Categories</CardTitle>
          <CardDescription>Track spending by category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {budgets.map((budget) => {
            const percentage = (budget.spent / budget.budget) * 100;
            const isOverBudget = percentage > 100;

            return (
              <div key={budget.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{budget.icon}</span>
                    <div>
                      <p className="font-medium">{budget.category}</p>
                      <p className="text-sm text-muted-foreground">
                        ${budget.spent.toFixed(2)} of $
                        {budget.budget.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      isOverBudget
                        ? "destructive"
                        : percentage > 80
                          ? "warning"
                          : "success"
                    }
                  >
                    {percentage.toFixed(0)}%
                  </Badge>
                </div>
                <Progress
                  value={Math.min(percentage, 100)}
                  className={isOverBudget ? "bg-destructive/20" : ""}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button className="flex-1">
          <PieChart className="mr-2 h-4 w-4" />
          View Insights
        </Button>
        <Button variant="outline" className="flex-1">
          Add Category
        </Button>
      </div>
    </div>
  );
}
