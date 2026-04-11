import { AuthButtons } from '@/components/auth-buttons'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white p-4 relative transition-colors duration-300">
      
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-sm bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-xl shadow-zinc-200/50 dark:shadow-none transition-colors duration-300">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-semibold tracking-tight text-center">Welcome back</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400 text-center">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <form>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
                className="bg-transparent border-zinc-300 dark:border-zinc-800 focus-visible:ring-primary dark:focus-visible:ring-zinc-700 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-transparent border-zinc-300 dark:border-zinc-800 focus-visible:ring-primary dark:focus-visible:ring-zinc-700 transition-colors"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <AuthButtons />
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
