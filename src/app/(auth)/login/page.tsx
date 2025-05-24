import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Water } from 'lucide-react'; // Using a generic icon for now

export default function LoginPage() {
  return (
    <Card className="shadow-xl">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex items-center justify-center rounded-full bg-primary p-3 text-primary-foreground">
          <Water className="h-10 w-10" />
        </div>
        <CardTitle className="text-3xl font-bold">AquaTrack Mobile</CardTitle>
        <CardDescription>Sign in to manage your water supply</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
