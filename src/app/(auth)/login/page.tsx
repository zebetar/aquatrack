
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets } from 'lucide-react'; 

export default function LoginPage() {
  return (
    <Card className="shadow-xl glassmorphism-card animate-fade-in w-full">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 p-3 text-primary dark:text-accent">
          <Droplets className="h-10 w-10" />
        </div>
        <CardTitle className="text-3xl font-bold">AquaTrack</CardTitle>
      </CardHeader>
      <CardContent className="py-8"> {/* Increased vertical padding */}
        <LoginForm />
      </CardContent>
    </Card>
  );
}
