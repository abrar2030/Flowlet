import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
/**
 * Renders a single transaction item.
 */
const TransactionItem = ({ transaction }) => {
  const isIncome = transaction.amount > 0;
  const amountClass = isIncome ? "text-green-600" : "text-red-600";
  const indicatorClass = isIncome ? "bg-green-500" : "bg-red-500";
  return _jsxs(
    "div",
    {
      className: "flex items-center justify-between",
      children: [
        _jsxs("div", {
          className: "flex items-center space-x-3",
          children: [
            _jsx("div", {
              className: `w-2 h-2 rounded-full ${indicatorClass}`,
            }),
            _jsxs("div", {
              children: [
                _jsx("p", {
                  className: "text-sm font-medium",
                  children: transaction.description,
                }),
                _jsx("p", {
                  className: "text-xs text-muted-foreground",
                  children: transaction.category,
                }),
              ],
            }),
          ],
        }),
        _jsxs("div", {
          className: "text-right",
          children: [
            _jsxs("p", {
              className: `text-sm font-medium ${amountClass}`,
              children: [
                isIncome ? "+" : "",
                "$",
                Math.abs(transaction.amount).toFixed(2),
              ],
            }),
            _jsx("p", {
              className: "text-xs text-muted-foreground",
              children: transaction.date,
            }),
          ],
        }),
      ],
    },
    transaction.id,
  );
};
/**
 * Displays a list of recent financial transactions.
 * @param {TransactionListProps} props - The component props.
 */
const TransactionList = ({ transactions }) => {
  return _jsxs(Card, {
    className: "lg:col-span-2",
    children: [
      _jsxs(CardHeader, {
        children: [
          _jsx(CardTitle, { children: "Recent Transactions" }),
          _jsx(CardDescription, { children: "Your latest financial activity" }),
        ],
      }),
      _jsxs(CardContent, {
        children: [
          _jsx("div", {
            className: "space-y-4",
            children: transactions.map((transaction) =>
              _jsx(
                TransactionItem,
                { transaction: transaction },
                transaction.id,
              ),
            ),
          }),
          _jsx(Button, {
            variant: "outline",
            className: "w-full mt-4",
            children: "View All Transactions",
          }),
        ],
      }),
    ],
  });
};
export default TransactionList;
