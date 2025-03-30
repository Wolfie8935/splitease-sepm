
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { User, Mail, Save, Cake, Camera, ChevronDown, Lock, Github } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const profileSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  displayName: z.string().min(2, {
    message: "Display name must be at least 2 characters.",
  }).optional(),
  birthday: z.string().optional(),
  bio: z.string().max(160, {
    message: "Bio must not be longer than 160 characters.",
  }).optional(),
});

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      displayName: "",
      birthday: "",
      bio: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setProfileData(data);
          
          form.reset({
            name: data.name || "",
            displayName: data.display_name || "",
            birthday: data.birthday || "",
            bio: data.bio || "",
          });
          
          if (data.avatar_url) {
            const { data: avatarData } = await supabase
              .storage
              .from('avatars')
              .getPublicUrl(data.avatar_url);
              
            setAvatarUrl(avatarData.publicUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    fetchProfile();
  }, [currentUser, form]);

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    
    try {
      // Update the profile data without the updated_at field
      const { error } = await supabase
        .from('profiles')
        .update({
          name: values.name,
          display_name: values.displayName,
          birthday: values.birthday,
          bio: values.bio,
        })
        .eq('id', currentUser.id);
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    if (!currentUser) return;

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}.${fileExt}`;
    const filePath = `${fileName}`;

    setUploadingAvatar(true);

    try {
      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Update the user's profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      // Get the public URL for the avatar
      const { data } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3">
            <Card>
              <CardHeader className="flex flex-col items-center text-center">
                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar}
                  />
                  <Avatar className="h-24 w-24 mx-auto">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={profileData?.name || 'User'} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {profileData?.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                <CardTitle className="mt-4">{profileData?.name || 'User'}</CardTitle>
                <CardDescription>{currentUser?.email}</CardDescription>
                
                <div className="w-full mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full text-sm" 
                    onClick={() => logout()}
                  >
                    Sign Out
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Connect Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full flex items-center justify-center gap-2"
                  variant="outline"
                  onClick={() => {
                    supabase.auth.signInWithOAuth({
                      provider: 'github',
                      options: {
                        redirectTo: `${window.location.origin}/profile`,
                      }
                    });
                  }}
                >
                  <Github className="h-4 w-4" />
                  Connect GitHub
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="w-full md:w-2/3">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your account and personal information
                </CardDescription>
              </CardHeader>

              <Tabs defaultValue="personal">
                <CardContent>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="personal">Personal Info</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                  </TabsList>
                </CardContent>

                <TabsContent value="personal">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                  <Input {...field} placeholder="Your full name" />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="displayName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Display Name</FormLabel>
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                  <Input {...field} placeholder="Your display name" />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="birthday"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Birthday</FormLabel>
                              <div className="flex items-center space-x-2">
                                <Cake className="h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                  <Input 
                                    type="date" 
                                    {...field}
                                  />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <textarea
                                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="Tell us a bit about yourself"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>

                      <CardFooter>
                        <Button 
                          type="submit" 
                          disabled={isLoading}
                          className="ml-auto"
                        >
                          {isLoading ? 'Saving...' : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="password">
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="current-password" 
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="new-password" 
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="confirm-password" 
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button className="ml-auto">
                      <Save className="mr-2 h-4 w-4" />
                      Update Password
                    </Button>
                  </CardFooter>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
