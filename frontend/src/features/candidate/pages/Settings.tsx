import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/organisms/Card';
import { Button } from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { Badge } from '@/components/atoms/Badge';

export default function CandidateSettings() {
  const portalOptions = [
    { value: 'CANDIDATE', label: 'Candidate Portal (default)' },
    { value: 'RECRUITER', label: 'Recruiter Portal' },
    { value: 'ADMIN', label: 'Admin Portal' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure system configurations and application notifications parameters.
        </p>
      </div>

      <div className="max-w-2xl">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">System Preferences</CardTitle>
            <CardDescription>Adjust localization settings and workspace views.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Select
              label="Default Workspace Role"
              options={portalOptions}
              defaultValue="CANDIDATE"
            />
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Security Lockouts</p>
                <p className="text-xs text-muted-foreground">
                  Require confirmation prompts for critical deletions.
                </p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button variant="primary">Save Preferences</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
