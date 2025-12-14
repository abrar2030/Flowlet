import { useParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Lock,
  Unlock,
  Trash2,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from "react";

export default function CardDetails() {
  const { cardId } = useParams();
  const [showNumber, setShowNumber] = useState(false);
  const [card] = useState({
    id: cardId || "1",
    last4: "4242",
    brand: "Visa",
    type: "Virtual",
    status: "active",
    balance: 1250.0,
    limit: 5000.0,
    expiryMonth: "12",
    expiryYear: "2027",
    cvv: "123",
  });

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Link to="/cards">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cards
        </Button>
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Card Details</CardTitle>
              <CardDescription>
                Manage your card settings and limits
              </CardDescription>
            </div>
            <Badge
              variant={card.status === "active" ? "success" : "destructive"}
            >
              {card.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-primary to-purple-600 rounded-lg p-6 text-white mb-6">
            <div className="flex justify-between items-start mb-8">
              <CreditCard className="h-8 w-8" />
              <span className="text-sm">{card.type}</span>
            </div>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xl tracking-wider">
                  {showNumber
                    ? `4242 4242 4242 ${card.last4}`
                    : `•••• •••• •••• ${card.last4}`}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNumber(!showNumber)}
                >
                  {showNumber ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex gap-8 text-sm">
                <div>
                  <span className="opacity-70">Expires</span> {card.expiryMonth}
                  /{card.expiryYear}
                </div>
                <div>
                  <span className="opacity-70">CVV</span>{" "}
                  {showNumber ? card.cvv : "•••"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                Available Balance
              </div>
              <div className="text-2xl font-bold">
                ${card.balance.toFixed(2)}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                Credit Limit
              </div>
              <div className="text-2xl font-bold">${card.limit.toFixed(2)}</div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" className="flex-1">
              <Lock className="mr-2 h-4 w-4" />
              Freeze Card
            </Button>
            <Button variant="outline" className="flex-1">
              <Unlock className="mr-2 h-4 w-4" />
              Change PIN
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
