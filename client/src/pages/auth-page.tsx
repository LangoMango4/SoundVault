import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginData, loginSchema } from "@shared/schema";
import { Redirect } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import abtutorIcon from "@assets/ABTutor.ico";

export default function AuthPage() {
  const { user, isLoading, loginMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"user" | "admin">("user");
  
  // Set up form
  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Handle form submission
  const onSubmit = (values: LoginData) => {
    loginMutation.mutate(values);
  };
  
  // Redirect to home if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={abtutorIcon} alt="Maths Homework" className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-semibold text-primary">Maths Homework</CardTitle>
          <CardDescription>
            Enter your credentials to access the soundboard
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs 
            defaultValue="user" 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as "user" | "admin")}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="user">User Login</TabsTrigger>
              <TabsTrigger value="admin">Admin Login</TabsTrigger>
            </TabsList>
            
            <TabsContent value="user">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {loginMutation.isError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {loginMutation.error.message || "Invalid username or password"}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || loginMutation.isPending}
                  >
                    {(isLoading || loginMutation.isPending) ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Login
                  </Button>
                  
                  <div className="text-center text-sm text-muted-foreground mt-4">
                    <p>Ask your administrator for login credentials</p>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="admin">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter admin username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter admin password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {loginMutation.isError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {loginMutation.error.message || "Invalid admin credentials"}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-secondary hover:bg-secondary/90" 
                    disabled={isLoading || loginMutation.isPending}
                  >
                    {(isLoading || loginMutation.isPending) ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Admin Login
                  </Button>
                  
                  <div className="text-center text-sm text-muted-foreground mt-4">
                    <p>Contact your system administrator for admin credentials</p>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}