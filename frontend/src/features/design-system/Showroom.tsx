import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Badge } from '@/components/atoms/Badge';
import { Avatar } from '@/components/atoms/Avatar';
import { Skeleton } from '@/components/atoms/Skeleton';
import { Toast } from '@/components/molecules/Toast';
import { Pagination } from '@/components/molecules/Pagination';
import { Tabs } from '@/components/molecules/Tabs';
import { Breadcrumbs } from '@/components/molecules/Breadcrumbs';
import { EmptyState } from '@/components/molecules/EmptyState';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/organisms/Card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/organisms/Table';
import Modal from '@/components/organisms/Modal';
import Drawer from '@/components/organisms/Drawer';
import ChartsContainer from '@/components/organisms/ChartsContainer';
import { Sparkles } from 'lucide-react';

export default function Showroom() {
  const [activeTab, setActiveTab] = useState('atoms');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const tabs = [
    { id: 'atoms', label: 'Atoms' },
    { id: 'molecules', label: 'Molecules' },
    { id: 'organisms', label: 'Organisms' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 relative">
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-250">
          <Toast
            message="This is a floating toast notification!"
            type="success"
            onClose={() => setShowToast(false)}
          />
        </div>
      )}

      {/* Intro Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-4xl font-extrabold tracking-tight font-display text-gradient mb-2">
          Design Showroom
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Premium design system components library inspired by Linear, Stripe, and Vercel. Fully
          optimized for keyboard accessibility, light/dark themes, and responsive screens.
        </p>
      </div>

      {/* Interactive Tabs Switcher */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />

      {/* ATOMS TAB */}
      {activeTab === 'atoms' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Buttons Section */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Buttons</CardTitle>
              <CardDescription>
                Actions triggers in primary, secondary, outline, and error layouts.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" isLoading>
                Loading
              </Button>
              <Button variant="outline" disabled>
                Disabled
              </Button>
            </CardContent>
          </Card>

          {/* Form Fields Section */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Inputs & Dropdowns</CardTitle>
              <CardDescription>
                Forms controls mapping error flags, labels, and borders.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Input label="Text input" placeholder="e.g. John Doe" />
              <Input
                label="Validation error"
                placeholder="john@example.com"
                error="Provide a valid email address"
              />
              <Select
                label="Select dropdown"
                options={[
                  { value: '1', label: 'Product Manager' },
                  { value: '2', label: 'Staff Architect' },
                ]}
              />
            </CardContent>
          </Card>

          {/* Indicators Section */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Status Labels & Avatars</CardTitle>
              <CardDescription>
                Badges, user avatars, and shimmering skeleton elements.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-8">
              <div className="flex gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>

              <div className="flex items-center gap-3">
                <Avatar name="Jane Doe" size="sm" />
                <Avatar name="Bob Smith" size="md" />
                <Avatar name="Alice Manager" size="lg" className="bg-emerald-500 text-slate-900" />
              </div>

              <div className="w-48 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MOLECULES TAB */}
      {activeTab === 'molecules' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Toast & Breadcrumbs */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Toasts & Breadcrumbs</CardTitle>
              <CardDescription>Navigation and sliding system message banners.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Breadcrumbs
                items={[{ label: 'System' }, { label: 'Design System' }, { label: 'Molecules' }]}
              />
              <div>
                <Button variant="outline" onClick={() => setShowToast(true)}>
                  Trigger Toast Notification
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pagers & Empty States */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Empty Placeholder Layouts</CardTitle>
              <CardDescription>Empty states and paginated controls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <EmptyState
                title="No assessment runs"
                description="Simulated mock evaluation screen. Create a job posting to parse cv details."
                icon={<Sparkles className="w-5 h-5 text-primary" />}
                actionText="Add Job Post"
                onAction={() => alert('Action triggered')}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={10}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ORGANISMS TAB */}
      {activeTab === 'organisms' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Overlays Section */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Overlays</CardTitle>
              <CardDescription>Centered modals and side slide drawers.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                Open Modal Dialog
              </Button>
              <Button variant="outline" onClick={() => setIsDrawerOpen(true)}>
                Open Slide Drawer
              </Button>
            </CardContent>
          </Card>

          {/* Analytics Graphs Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartsContainer
              title="Global Platform Traffic"
              type="line"
              description="Hourly API request distributions."
            />
            <ChartsContainer
              title="Invokes Grouped By Portal"
              type="bar"
              description="Token usage grouped by role."
            />
          </div>

          {/* Tables Section */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Target Position</TableHead>
                <TableHead className="text-right">Match Index</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <div className="font-semibold text-foreground">Alice Smith</div>
                </TableCell>
                <TableCell>Full Stack Engineer</TableCell>
                <TableCell className="text-right font-bold text-emerald-500">94% Match</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <div className="font-semibold text-foreground">Bob Johnson</div>
                </TableCell>
                <TableCell>React Developer</TableCell>
                <TableCell className="text-right font-bold text-primary">88% Match</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Modal Popups stubs */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="System Alert popup"
            footerActions={
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsModalOpen(false);
                    alert('Success');
                  }}
                >
                  Apply
                </Button>
              </>
            }
          >
            <p className="text-sm text-muted-foreground">
              Adjust system authorization scope and user permissions parameters.
            </p>
          </Modal>

          {/* Slide Drawers stubs */}
          <Drawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            title="Branding Configurations"
            footerActions={
              <>
                <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setIsDrawerOpen(false)}>
                  Save Settings
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              <Input label="Company Name" defaultValue="TechCorp Labs" />
            </div>
          </Drawer>
        </div>
      )}
    </div>
  );
}
