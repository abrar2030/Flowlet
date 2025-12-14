import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function IssueCard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardType: "virtual",
    cardholderName: "",
    spendingLimit: "1000",
    purpose: "business",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    navigate("/cards");
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Link to="/cards">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cards
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Issue New Card</CardTitle>
              <CardDescription>
                Create a new virtual or physical card
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cardType">Card Type</Label>
              <Select
                value={formData.cardType}
                onValueChange={(v) => setFormData({ ...formData, cardType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virtual">Virtual Card</SelectItem>
                  <SelectItem value="physical">Physical Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Cardholder Name</Label>
              <Input
                id="name"
                value={formData.cardholderName}
                onChange={(e) =>
                  setFormData({ ...formData, cardholderName: e.target.value })
                }
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Spending Limit (USD)</Label>
              <Input
                id="limit"
                type="number"
                value={formData.spendingLimit}
                onChange={(e) =>
                  setFormData({ ...formData, spendingLimit: e.target.value })
                }
                placeholder="1000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Select
                value={formData.purpose}
                onValueChange={(v) => setFormData({ ...formData, purpose: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business Expenses</SelectItem>
                  <SelectItem value="personal">Personal Use</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="subscription">Subscriptions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Issuing Card..." : "Issue Card"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
