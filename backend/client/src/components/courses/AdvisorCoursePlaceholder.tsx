import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronRight,
  GraduationCap,
  Layers,
  Search,
  Users,
} from "lucide-react";

interface AdvisorCourse {
  id: string;
  code: string;
  title: string;
  semester: string;
  year: string;
  adviseeCount: number;
  submissionsDue: number;
  lastUpdated: string;
  status: "On Track" | "Needs Review" | "At Risk";
  projects: Array<{
    id: string;
    title: string;
    teamName: string;
    summary: string;
    status: string;
    lastTouchpoint: string;
    progress: number;
    nextMilestone: string;
  }>;
}

export const AdvisorCoursePlaceholder = () => {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const courses = useMemo<AdvisorCourse[]>(
    () => [
      {
        id: "capstone-401",
        code: "CS-401",
        title: "Senior Project Capstone",
        semester: "1",
        year: "2024",
        adviseeCount: 12,
        submissionsDue: 3,
        lastUpdated: "2 days ago",
        status: "On Track",
        projects: [
          {
            id: "proj-1",
            title: "AI-Powered Assessment Platform",
            teamName: "Cortex Builders",
            summary:
              "Automated rubric-based scoring for multimedia project submissions.",
            status: "Prototype Review",
            lastTouchpoint: "Mar 30, 2024",
            progress: 72,
            nextMilestone: "UX usability testing",
          },
          {
            id: "proj-2",
            title: "Sustainable Campus Tracker",
            teamName: "GreenPulse",
            summary:
              "IoT dashboard surfacing energy, water, and recycling trends.",
            status: "Data Collection",
            lastTouchpoint: "Mar 28, 2024",
            progress: 58,
            nextMilestone: "Integrate analytics service",
          },
        ],
      },
      {
        id: "software-302",
        code: "CS-302",
        title: "Software Engineering",
        semester: "2",
        year: "2024",
        adviseeCount: 18,
        submissionsDue: 5,
        lastUpdated: "5 days ago",
        status: "Needs Review",
        projects: [
          {
            id: "proj-3",
            title: "Community Garden Connect",
            teamName: "Garden Links",
            summary: "Mobile app pairing volunteers with garden coordinators.",
            status: "Sprint Planning",
            lastTouchpoint: "Mar 25, 2024",
            progress: 44,
            nextMilestone: "Finalize API contracts",
          },
        ],
      },
      {
        id: "innov-210",
        code: "CS-210",
        title: "Innovation Lab",
        semester: "1",
        year: "2024",
        adviseeCount: 9,
        submissionsDue: 1,
        lastUpdated: "1 week ago",
        status: "At Risk",
        projects: [],
      },
    ],
    []
  );

  const selectedCourse =
    courses.find((course) => course.id === selectedCourseId) || null;

  const filteredCourses = courses.filter((course) => {
    const haystack = `${course.code} ${course.title}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  const statusBadges: Record<AdvisorCourse["status"], string> = {
    "On Track": "bg-emerald-100 text-emerald-700",
    "Needs Review": "bg-amber-100 text-amber-700",
    "At Risk": "bg-rose-100 text-rose-700",
  };

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    console.log(`Advisor Course placeholder course selected: ${courseId}`);
  };

  const handleProjectAction = (projectId: string) => {
    console.log(`Advisor Course placeholder project clicked: ${projectId}`);
  };

  if (selectedCourse) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          className="pl-0"
          onClick={() => setSelectedCourseId(null)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              {selectedCourse.title}
            </CardTitle>
            <CardDescription>
              {selectedCourse.code} • Semester {selectedCourse.semester} •{" "}
              {selectedCourse.year}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Active Advisees</p>
              <p className="text-2xl font-semibold">
                {selectedCourse.adviseeCount}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Submissions Due</p>
              <p className="text-2xl font-semibold">
                {selectedCourse.submissionsDue}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-2xl font-semibold">
                {selectedCourse.lastUpdated}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Project Cohort
            </CardTitle>
            <CardDescription>
              Quick view of advisee submissions and their current milestones.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            {selectedCourse.projects.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                No projects yet. Once advisees submit work, status cards will
                appear here.
              </div>
            )}
            {selectedCourse.projects.map((project) => (
              <Card key={project.id} className="border shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    {project.title}
                  </CardTitle>
                  <CardDescription>{project.teamName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {project.summary}
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="secondary">Status: {project.status}</Badge>
                    <Badge variant="outline">
                      Progress: {project.progress}%
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Last touchpoint: {project.lastTouchpoint}</p>
                    <p>Next milestone: {project.nextMilestone}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleProjectAction(project.id)}
                  >
                    Open advisee record
                  </Button>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Advisor Courses</h1>
        <p className="text-muted-foreground">
          Quick placeholder view so you can see how advisee courses and projects
          will eventually surface here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filter Courses
          </CardTitle>
          <CardDescription>
            Search by course code or course title.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Advisee Courses
          </CardTitle>
          <CardDescription>
            Placeholder dataset with quick stats so navigation feels real.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead className="hidden md:table-cell">Semester</TableHead>
                <TableHead>Advisees</TableHead>
                <TableHead>Due Soon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div className="font-medium">{course.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {course.code}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Semester {course.semester} • {course.year}
                    </div>
                  </TableCell>
                  <TableCell>{course.adviseeCount}</TableCell>
                  <TableCell>{course.submissionsDue}</TableCell>
                  <TableCell>
                    <Badge className={statusBadges[course.status]}>
                      {course.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCourseSelect(course.id)}
                    >
                      View projects <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
