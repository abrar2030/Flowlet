import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Zap,
  Globe,
  Shield,
  DollarSign,
  CreditCard,
  Wallet,
} from "lucide-react";

export default function PaymentsPage() {
  const paymentFeatures = [
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      title: "Instant Transfers",
      description: "Real-time payment processing with sub-second settlements",
    },
    {
      icon: <Globe className="h-8 w-8 text-blue-500" />,
      title: "Global Coverage",
      description: "Accept payments from 190+ countries in 135+ currencies",
    },
    {
      icon: <Shield className="h-8 w-8 text-green-500" />,
      title: "Fraud Prevention",
      description: "AI-powered fraud detection with 99.9% accuracy",
    },
    {
      icon: <DollarSign className="h-8 w-8 text-purple-500" />,
      title: "Low Fees",
      description: "Competitive rates starting at 0.5% per transaction",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link to="/home" className="flex items-center gap-2">
              <Wallet className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">Flowlet</span>
            </Link>
            <Link to="/login">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            Payment Processing Made Simple
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Accept payments globally with our secure, fast, and reliable payment
            infrastructure
          </p>
          <Link to="/register">
            <Button size="lg" className="gap-2">
              Start Processing <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {paymentFeatures.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="mb-2">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="border-2 border-primary/50">
          <CardContent className="p-12 text-center">
            <CreditCard className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-4">
              Ready to accept payments?
            </h2>
            <p className="text-muted-foreground mb-6">
              Get started in minutes with our easy integration
            </p>
            <Link to="/register">
              <Button size="lg">Create Account</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
