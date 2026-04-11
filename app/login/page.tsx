import { AuthButtons } from '@/components/auth-buttons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import { Film } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-4 relative transition-colors duration-300">

      {/* App branding top-left */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
          <Film className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground/80 tracking-tight">Studio Mode</span>
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl shadow-black/5 dark:shadow-none p-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to save your work and unlock 50 credits
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="h-10 bg-background border-border focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="h-10 bg-background border-border focus-visible:ring-ring"
            />
          </div>

          {/* All buttons inside the same form context — no CardFooter split */}
          <AuthButtons />
        </form>

      </div>
    </div>
  )
}
