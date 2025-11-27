import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionListProps } from "@/types/wallet";

/**
 * Renders a single transaction item.
 */
const TransactionItem: React.FC<{
  transaction: TransactionListProps["transactions"][0];
}> = ({ transaction }) => {
  const isIncome = transaction.amount > 0;
  const amountClass = isIncome ? "text-green-600" : "text-red-600";
  const indicatorClass = isIncome ? "bg-green-500" : "bg-red-500";

  return (
    <div key={transaction.id} className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${indicatorClass}`} />
        <div>
          <p className="text-sm font-medium">{transaction.description}</p>
          <p className="text-xs text-muted-foreground">
            {transaction.category}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-medium ${amountClass}`}>
          {isIncome ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground">{transaction.date}</p>
      </div>
    </div>
  );
};

/**
 * Displays a list of recent financial transactions.
 * @param {TransactionListProps} props - The component props.
 */
const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your latest financial activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
        </div>
        <Button variant="outline" className="w-full mt-4">
          View All Transactions
        </Button>
      </CardContent>
    </Card>
  );
};

export default TransactionList;
