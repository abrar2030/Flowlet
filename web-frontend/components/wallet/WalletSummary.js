import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
/**
 * Renders a single quick statistic card.
 */
const QuickStatCard = ({ stat }) => {
  const Icon = stat.icon;
  const isUp = stat.trend === "up";
  return _jsxs(Card, {
    children: [
      _jsxs(CardHeader, {
        className: "flex flex-row items-center justify-between space-y-0 pb-2",
        children: [
          _jsx(CardTitle, {
            className: "text-sm font-medium",
            children: stat.title,
          }),
          _jsx(Icon, { className: "h-4 w-4 text-muted-foreground" }),
        ],
      }),
      _jsxs(CardContent, {
        children: [
          _jsx("div", {
            className: "text-2xl font-bold",
            children: stat.value,
          }),
          _jsxs("p", {
            className: `text-xs ${isUp ? "text-green-600" : "text-red-600"}`,
            children: [stat.change, " from last month"],
          }),
        ],
      }),
    ],
  });
};
/**
 * Displays a grid of quick financial statistics.
 * @param {WalletSummaryProps} props - The component props.
 */
const WalletSummary = ({ quickStats }) => {
  return _jsx("div", {
    className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
    children: quickStats.map((stat, index) =>
      _jsx(QuickStatCard, { stat: stat }, index),
    ),
  });
};
export default WalletSummary;
