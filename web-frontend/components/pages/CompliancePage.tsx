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
  Shield,
  CheckCircle,
  FileText,
  AlertTriangle,
  Wallet,
} from "lucide-react";

export default function CompliancePage() {
  const complianceFeatures = [
    {
      icon: <Shield className="h-8 w-8 text-blue-500" />,
      title: "KYC/AML",
      description:
        "Automated identity verification and anti-money laundering checks",
    },
    {
      icon: <FileText className="h-8 w-8 text-green-500" />,
      title: "Audit Trails",
      description: "Complete transaction history with detailed audit logs",
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-purple-500" />,
      title: "Regulatory Compliance",
      description: "Built-in compliance with GDPR, PSD2, and FinCEN",
    },
    {
      icon: <AlertTriangle className="h-8 w-8 text-yellow-500" />,
      title: "Risk Management",
      description: "Real-time risk scoring and fraud prevention",
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
          <h1 className="text-5xl font-bold mb-6">Compliance Built-In</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Stay compliant with financial regulations across all jurisdictions
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {complianceFeatures.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="mb-2">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
