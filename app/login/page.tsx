import { AuthButtons } from '@/components/auth-buttons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import { Film, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-4 relative transition-colors duration-300">

      {/* Navigation Back */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 flex items-center gap-2 group text-muted-foreground hover:text-foreground transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Film className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-tight">Studio Mode</span>
          <span className="text-[10px] opacity-70 group-hover:opacity-100 italic transition-opacity">← Back to work</span>
        </div>
      </Link>

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

        <div className="pt-2 text-center border-t border-border/50">
          <Link 
            href="/" 
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 group"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
            Continue as Guest
          </Link>
        </div>

      </div>
    </div>
  )
}
