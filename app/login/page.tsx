import { AuthButtons } from '@/components/auth-buttons'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white p-4">
      <Card className="w-full max-w-sm bg-zinc-950 border-zinc-800 text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription className="text-zinc-400">
            Sign in to your account or create a new one.
          </CardDescription>
        </CardHeader>
        <form>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
                className="bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <AuthButtons />
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
