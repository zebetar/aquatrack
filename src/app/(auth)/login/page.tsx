
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets } from 'lucide-react'; 

export default function LoginPage() {
  return (
    <Card className="shadow-xl glassmorphism-card w-full">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex items-center justify-center rounded-full bg-sky-500/10 p-3 text-sky-500">
          <Droplets className="h-10 w-10" />
        </div>
        <CardTitle className="text-4xl font-bold lowercase tracking-tighter text-sky-500 animate-shimmer">aquatrack</CardTitle>
      </CardHeader>
      <CardContent className="py-8">
        <LoginForm />
      </CardContent>
    </Card>
  );
}
