import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Code, Book, Zap, Terminal, Wallet } from "lucide-react";

export default function DeveloperPortalPage() {
  const devResources = [
    {
      icon: <Book className="h-8 w-8" />,
      title: "API Documentation",
      description: "Complete API reference with examples",
    },
    {
      icon: <Code className="h-8 w-8" />,
      title: "SDKs & Libraries",
      description: "Official SDKs for all major languages",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Quick Start",
      description: "Get up and running in minutes",
    },
    {
      icon: <Terminal className="h-8 w-8" />,
      title: "Sandbox Environment",
      description: "Test your integration safely",
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
          <h1 className="text-5xl font-bold mb-6">Developer Portal</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Everything you need to integrate Flowlet into your application
          </p>
          <Link to="/register">
            <Button size="lg">Get API Keys</Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {devResources.map((resource, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="mb-2 text-primary">{resource.icon}</div>
                <CardTitle>{resource.title}</CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
