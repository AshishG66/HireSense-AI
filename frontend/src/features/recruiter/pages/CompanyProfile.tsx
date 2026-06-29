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
import { Select } from '@/components/atoms/Select';

export default function RecruiterCompanyProfile() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5">
          Company Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure corporate branding and recruiter parameters.
        </p>
      </div>

      <div className="max-w-2xl">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Corporate Identity</CardTitle>
            <CardDescription>
              Setup details visible to applicants during screening sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input label="Company Name" defaultValue="TechCorp Labs" />
              <Input label="Website Domain" defaultValue="https://techcorplabs.com" />
              <Input label="Headquarters Location" defaultValue="Austin, TX" />
              <Select
                label="Company Size"
                options={[
                  { value: 'small', label: '1 - 50 employees' },
                  { value: 'medium', label: '50 - 500 employees' },
                  { value: 'large', label: '500+ employees' },
                ]}
                defaultValue="medium"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button variant="primary">Save Configuration</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
