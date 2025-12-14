import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Activity,
  BarChart3,
} from "lucide-react";

export default function AnalyticsScreen() {
  const stats = [
    {
      title: "Total Transactions",
      value: "1,234",
      change: "+12%",
      icon: Activity,
    },
    {
      title: "Total Volume",
      value: "$45,678",
      change: "+8%",
      icon: DollarSign,
    },
    { title: "Active Cards", value: "23", change: "+3", icon: CreditCard },
    {
      title: "Avg Transaction",
      value: "$37.02",
      change: "-2%",
      icon: BarChart3,
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track your financial performance and insights
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="spending">Spending</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Overview</CardTitle>
              <CardDescription>
                Your transaction activity over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
              Chart visualization would be displayed here
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Analysis</CardTitle>
            </CardHeader>
            <CardContent>Detailed transaction analytics</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spending">
          <Card>
            <CardHeader>
              <CardTitle>Spending Patterns</CardTitle>
            </CardHeader>
            <CardContent>Spending category breakdown</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
