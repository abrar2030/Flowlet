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
  CreditCard,
  Wallet,
  Shield,
  Zap,
  Globe,
  TrendingUp,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: <Wallet className="h-8 w-8" />,
      title: "Digital Wallets",
      description:
        "Seamlessly manage multi-currency digital wallets with real-time balance tracking.",
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: "Card Issuance",
      description:
        "Issue virtual and physical cards instantly with comprehensive controls.",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Bank-Grade Security",
      description:
        "Enterprise-level encryption and fraud detection to keep your funds safe.",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Instant Payments",
      description:
        "Send and receive payments instantly with low fees and multiple payment methods.",
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Global Reach",
      description:
        "Support for multiple currencies and international transactions.",
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Analytics & Insights",
      description:
        "Track spending patterns and get actionable insights on your finances.",
    },
  ];

  const benefits = [
    "KYC/AML Compliance Built-in",
    "PCI-DSS Certified Infrastructure",
    "Real-time Transaction Monitoring",
    "Advanced Fraud Detection AI",
    "Multi-factor Authentication",
    "24/7 Customer Support",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">Flowlet</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Content */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Embedded Finance Platform for Modern Businesses
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Seamlessly integrate wallets, payments, and cards into your
            products. Built for developers, trusted by enterprises.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Start Building <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/developer">
              <Button size="lg" variant="outline">
                View Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Everything You Need for Embedded Finance
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A complete suite of financial services designed to integrate
            seamlessly into your application.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-2 hover:border-primary/50 transition-colors"
            >
              <CardHeader>
                <div className="text-primary mb-2">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20 bg-secondary/30 rounded-lg">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Built with Compliance & Security First
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-2 border-primary/50">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Build the Future of Finance?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join hundreds of companies using Flowlet to embed financial
              services into their products.
            </p>
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              <span className="font-semibold">Flowlet</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Flowlet. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
