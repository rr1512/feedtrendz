import Link from 'next/link'
import { Button } from '@/frontend/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card'
import { Users, FileText, Calendar, Share2, Zap, Shield } from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together with script writers, video editors, and social media managers in one platform.'
  },
  {
    icon: FileText,
    title: 'Content Management',
    description: 'Create, edit, and manage all your content briefs with a structured workflow system.'
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Schedule your posts across multiple social media platforms with our intelligent scheduling system.'
  },
  {
    icon: Share2,
    title: 'Multi-Platform Publishing',
    description: 'Connect and publish to Facebook, Instagram, TikTok, Threads, and YouTube simultaneously.'
  },
  {
    icon: Zap,
    title: 'Workflow Automation',
    description: 'Streamline your content production with automated status updates and notifications.'
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Your content and data are protected with enterprise-grade security and reliability.'
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-sm font-bold">C</span>
            </div>
            <span className="font-bold text-xl">CollabContent</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Collaborate, Create, and 
            <span className="text-primary"> Publish</span> with Ease
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your content creation workflow with our collaborative platform. 
            From brief to publish, manage your entire content lifecycle in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need for content collaboration
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to streamline your content creation process
            and enhance team productivity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="text-center border-0 shadow-sm">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to transform your content workflow?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of teams who trust CollabContent for their 
              content creation and social media management.
            </p>
            <Button size="lg" asChild>
              <Link href="/register">Get Started Today</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                <span className="text-xs font-bold">C</span>
              </div>
              <span className="font-semibold">CollabContent</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 CollabContent. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}