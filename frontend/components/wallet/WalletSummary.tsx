import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletSummaryProps } from "@/types/wallet";

/**
 * Renders a single quick statistic card.
 */
const QuickStatCard: React.FC<{
  stat: WalletSummaryProps["quickStats"][0];
}> = ({ stat }) => {
  const Icon = stat.icon;
  const isUp = stat.trend === "up";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value}</div>
        <p className={`text-xs ${isUp ? "text-green-600" : "text-red-600"}`}>
          {stat.change} from last month
        </p>
      </CardContent>
    </Card>
  );
};

/**
 * Displays a grid of quick financial statistics.
 * @param {WalletSummaryProps} props - The component props.
 */
const WalletSummary: React.FC<WalletSummaryProps> = ({ quickStats }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {quickStats.map((stat, index) => (
        <QuickStatCard key={index} stat={stat} />
      ))}
    </div>
  );
};

export default WalletSummary;
