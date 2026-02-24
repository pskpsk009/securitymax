import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, Edit, Calendar, User, Loader2, AlertCircle } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "coordinator" | "advisor";
}

interface Project {
  id: string;
  title: string;
  type: string;
  status: string;
  submissionDate: string;
  lastModified: string;
  description: string;
  students: string[];
  advisor: string;
  teamMembers?: { id: string; name: string; email: string; role: string; isPrimary: boolean }[];
  files?: { name: string; size?: string; type?: string }[];
  completionDate?: string;
  keywords?: string[];
  teamName?: string;
  course?: string;
  courseCode?: string | null;
  semester?: string;
  year?: string;
  competitionName?: string;
  award?: string;
  externalLinks?: string[];
  impact?: string;
}

interface MyProjectsViewProps {
  user: User;
  projects?: Project[];
  onViewProject: (projectId: string) => void;
  onEditProject?: (projectId: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export const MyProjectsView = ({
  user,
  projects: passedProjects,
  onViewProject,
  onEditProject,
  isLoading = false,
  errorMessage,
}: MyProjectsViewProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Under Review":
        return "bg-yellow-100 text-yellow-800";
      case "Draft":
        return "bg-red-100 text-red-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDisplayName = (status: string) => {
    return status === "Draft" ? "Deny" : status;
  };

  const projectsToUse = passedProjects ?? [];
  const filteredProjects = projectsToUse
    .filter((project) => {
      const normalizedTitle = project.title?.toLowerCase() ?? "";
      const normalizedDescription = project.description?.toLowerCase() ?? "";
      const matchesSearch =
        normalizedTitle.includes(searchTerm.toLowerCase()) ||
        normalizedDescription.includes(searchTerm.toLowerCase()) ||
        (!!project.courseCode && project.courseCode.toString().includes(searchTerm));

      return matchesSearch;
    })
    .sort((a, b) => {
      // For advisors, show "Under Review" projects first
      if (user.role === "advisor") {
        if (a.status === "Under Review" && b.status !== "Under Review") return -1;
        if (b.status === "Under Review" && a.status !== "Under Review") return 1;
      }
      return 0;
    });

  const getViewTitle = () => {
    switch (user.role) {
      case "student":
        return "My Projects";
      case "advisor":
        return "Advisee Projects";
      case "coordinator":
        return "All Projects";
      default:
        return "Projects";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">{getViewTitle()}</h2>
        <div className="text-sm text-gray-500">
          {filteredProjects.length} project(s) found
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading projects from Supabase...</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center space-x-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search projects, course codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const studentList =
            Array.isArray(project.students) && project.students.length > 0
              ? project.students.join(", ")
              : "Students pending";
          const dateToDisplay = project.submissionDate || project.lastModified;
          const displayDate = dateToDisplay
            ? new Date(dateToDisplay).toLocaleDateString()
            : "Date not available";

          return (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                  <Badge variant="outline" className="shrink-0 ml-2">
                    {project.type}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-3">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div className="flex justify-start items-center">
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusDisplayName(project.status)}
                  </Badge>
                </div>

                {/* Project Details */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    <span>{studentList}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {project.submissionDate
                        ? `Submitted: ${displayDate}`
                        : `Modified: ${displayDate}`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button onClick={() => onViewProject(project.id)} size="sm" className="flex-1">
                    {user.role === "advisor" && project.status === "Under Review" ? (
                      <Edit className="w-4 h-4 mr-2" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    {user.role === "advisor" && project.status === "Under Review" ? "Review" : "View"}
                  </Button>
                  {project.status === "Draft" && user.role === "student" && (
                    <Button size="sm" variant="outline" onClick={() => onEditProject?.(project.id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No projects found</div>
          <p className="text-gray-500 mt-2">
            {searchTerm 
              ? "Try adjusting your search criteria"
              : "No projects have been submitted yet"
            }
          </p>
        </div>
      )}
    </div>
  );
};
