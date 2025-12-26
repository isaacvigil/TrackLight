import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, Zap, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <main className="w-full max-w-4xl space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Welcome to TrackLight
          </h1>
          <p className="text-lg text-muted-foreground">
            shadcn/ui is now installed and ready to use
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Sparkles className="mb-2 size-8 text-primary" />
              <CardTitle>Beautiful UI</CardTitle>
              <CardDescription>
                Accessible and customizable components built with Radix UI and Tailwind CSS
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="mb-2 size-8 text-primary" />
              <CardTitle>Fast Development</CardTitle>
              <CardDescription>
                Copy-paste components that you can modify to fit your needs
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="mb-2 size-8 text-primary" />
              <CardTitle>Type Safe</CardTitle>
              <CardDescription>
                Full TypeScript support with excellent developer experience
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Try it out</CardTitle>
            <CardDescription>
              Test the installed components below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Enter your email..." className="flex-1" />
              <Button>Subscribe</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="default">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            To add more components, run:{" "}
            <code className="rounded bg-muted px-2 py-1 font-mono">
              npx shadcn@latest add [component]
            </code>
          </p>
        </div>
      </main>
    </div>
  );
}
