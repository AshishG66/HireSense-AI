import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/organisms/Card';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Avatar } from '@/components/atoms/Avatar';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function CandidateProfile() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5">
          Candidate Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage personal metadata, work histories, and contact coordinates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card Summary */}
        <div className="md:col-span-1 space-y-6">
          <Card className="text-center bg-card">
            <CardContent className="pt-8 flex flex-col items-center">
              <Avatar
                name="Alice Smith"
                size="lg"
                className="mb-4 w-20 h-20 text-xl bg-emerald-500 text-slate-900"
              />
              <h2 className="text-lg font-bold text-foreground font-display">Alice Smith</h2>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                Senior Frontend Architect
              </p>

              <div className="w-full mt-6 space-y-3 pt-6 border-t border-border text-left text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                  <span className="truncate">candidate@hiresense.ai</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                  <span>+1 (555) 019-2834</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                  <span>San Francisco, CA</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Editor Fields */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Personal Parameters</CardTitle>
              <CardDescription>
                Update your profile coordinates and contact details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="First Name" defaultValue="Alice" />
                <Input label="Last Name" defaultValue="Smith" />
                <Input label="Email Address" defaultValue="candidate@hiresense.ai" type="email" />
                <Input label="Phone Number" defaultValue="+1 (555) 019-2834" />
                <Input label="Location" defaultValue="San Francisco, CA" />
                <Input label="Headline" defaultValue="Senior Frontend Architect" />
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button variant="primary">Save Changes</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
