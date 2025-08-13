import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Download, 
  Upload, 
  Settings, 
  User, 
  Bell,
  Star,
  Heart,
  CheckCircle
} from "lucide-react";

export default function ComponentDemo() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold">UI Component Library</h1>
        <p className="text-muted-foreground">A collection of reusable React components with shadcn/ui and Tailwind CSS</p>
      </header>

      <Tabs defaultValue="buttons" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="misc">Misc</TabsTrigger>
        </TabsList>

        <TabsContent value="buttons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>Different button styles and states</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Buttons with Icons</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button><Download className="mr-2 h-4 w-4" />Download</Button>
              <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Upload</Button>
              <Button variant="secondary"><Settings className="mr-2 h-4 w-4" />Settings</Button>
              <Button variant="ghost"><Search className="mr-2 h-4 w-4" />Search</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Simple Card</CardTitle>
                <CardDescription>Basic card with header and content</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is a simple card component with some content.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Featured Card
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>A card with an icon in the title.</p>
                <div className="mt-4">
                  <Badge variant="secondary">Featured</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stats Card</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$1,234</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
              <CardDescription>Input fields and form components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="search" placeholder="Search..." className="pl-10" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button>Submit</Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="misc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  This is a success alert message.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Icons</CardTitle>
              <CardDescription>Sample Lucide React icons</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <User className="h-6 w-6" />
              <Bell className="h-6 w-6" />
              <Heart className="h-6 w-6" />
              <Star className="h-6 w-6" />
              <Settings className="h-6 w-6" />
              <Download className="h-6 w-6" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}