import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MyProjectsView } from "@/components/projects/MyProjectsView";
import { ProjectSubmissionForm } from "@/components/projects/ProjectSubmissionForm";
import { ProjectArchive } from "@/components/projects/ProjectArchive";
import { UserManagement } from "@/components/admin/UserManagement";
import { ReportingDashboard } from "@/components/reports/ReportingDashboard";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";
import { RubricManagement } from "@/components/rubrics/RubricManagement";
import { CourseManagement } from "@/components/courses/CourseManagement";
import { AdvisorCoursePlaceholder } from "@/components/courses/AdvisorCoursePlaceholder";
import { StudentRosterUpload } from "@/components/courses/StudentRosterUpload";
import { fetchProjects, ApiProject, ApiTeamMember, ApiProjectFile, ApiProjectStudent, ApiError } from "@/services/projectApi";
import { auth } from "@/lib/firebase";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "coordinator" | "advisor";
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "student" | "lecturer";
  isPrimary: boolean;
}

interface Project {
  id: string;
  title: string;
  type: string;
  status: string;
  submissionDate: string;
  lastModified: string;
  impact: string;
  description: string;
  students: string[];
  studentDetails?: ApiProjectStudent[];
  advisor: string;
  advisorEmail?: string;
  teamName: string;
  teamMembers: TeamMember[];
  externalLinks: string[];
  keywords: string[];
  course: string;
  courseCode?: string | null;
  year: string;
  semester: string;
  files: { name: string; size?: string; type?: string }[];
  competitionName: string;
  award: string;
  completionDate?: string;
  grade?: string | null;
  feedback?: {
    advisor?: string | null;
    coordinator?: string | null;
  };
  studentId?: string;
  studentName?: string;
  dueDate?: string;
  competition?: string;
  attachments?: { name: string; size: string; type: string }[];
  progress?: number;
}

interface ProjectUpdateData {
  title?: string;
  type?: string;
  description?: string;
  course?: string;
  keywords?: string[];
  competitionName?: string;
  award?: string;
  teamName?: string;
  teamMembers?: TeamMember[];
  externalLinks?: string[];
}

interface NewProject {
  id: string;
  title: string;
  type: string;
  status: string;
  submissionDate: string;
  lastModified: string;
  impact: string;
  description: string;
  students: string[];
  advisor: string;
  keywords: string[];
  course: string;
  year: string;
  semester: string;
  files: { name: string; size: string; type: string }[];
  competitionName: string;
  award: string;
  teamName: string;
  teamMembers: TeamMember[];
  externalLinks: string[];
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [currentView, setCurrentView] = useState("my-projects");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [sourceView, setSourceView] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const normalizeTeamMembers = (members?: ApiTeamMember[]): TeamMember[] => {
    if (!members) {
      return [];
    }

    return members.map((member) => ({
      id: member.id ? String(member.id) : member.email,
      name: member.name ?? member.email,
      email: member.email,
      role: member.role === "lecturer" ? "lecturer" : "student",
      isPrimary: Boolean(member.isPrimary),
    }));
  };

  const normalizeFiles = (files?: ApiProjectFile[]): { name: string; size?: string; type?: string }[] => {
    if (!files) {
      return [];
    }

    return files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));
  };

  const mapApiProject = (project: ApiProject): Project => ({
    id: project.id.toString(),
    title: project.title,
    type: project.type,
    status: project.status,
    submissionDate: project.submissionDate ?? "",
    lastModified: project.lastModified ?? "",
    impact: project.impact ?? "",
    description: project.description ?? "",
    students: project.students ?? [],
    studentDetails: project.studentDetails ?? [],
    advisor: project.advisor ?? "",
    advisorEmail: project.advisorEmail,
    teamName: project.teamName ?? "",
    teamMembers: normalizeTeamMembers(project.teamMembers),
    externalLinks: project.externalLinks ?? [],
    keywords: project.keywords ?? [],
    course: "",
    courseCode: project.courseCode ?? null,
    year: project.year ?? "",
    semester: project.semester ?? "",
    files: normalizeFiles(project.files),
    competitionName: project.competitionName ?? "",
    award: project.award ?? "",
    completionDate: project.completionDate ?? "",
    grade: project.grade ?? null,
    feedback: project.feedback,
  });

  // Load saved state on component mount
  useEffect(() => {
    const savedView = localStorage.getItem("currentView");
    const savedProject = localStorage.getItem("selectedProject");
    const savedEditingProject = localStorage.getItem("editingProject");
    const savedProjects = localStorage.getItem("projects");

    if (savedView) {
      setCurrentView(savedView);
    }

    if (savedProject && savedProject !== "null") {
      setSelectedProject(savedProject);
    }

    if (savedEditingProject && savedEditingProject !== "null") {
      setEditingProject(savedEditingProject);
    }

    // Load saved projects if available
    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects);
        setProjects(parsedProjects);
      } catch (error) {
        console.error("Failed to parse saved projects:", error);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const resolveAuthToken = async (forceRefresh = false): Promise<string> => {
      const currentUser = auth.currentUser;

      if (currentUser) {
        try {
          const refreshedToken = await currentUser.getIdToken(forceRefresh);
          localStorage.setItem("authToken", refreshedToken);
          return refreshedToken;
        } catch (tokenError) {
          console.error("Failed to refresh Firebase token", tokenError);
        }
      }

      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        return storedToken;
      }

      throw new Error("Missing authentication token. Please sign in again.");
    };

    const handleProjectsError = (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to fetch projects. Please try again.";
      setProjectsError(message);
    };

    const loadProjects = async () => {
      setIsProjectsLoading(true);
      setProjectsError(null);

      try {
        let tokenToUse = await resolveAuthToken();
        let apiProjects = await fetchProjects(tokenToUse);
        if (!isMounted) {
          return;
        }

        const normalizedProjects = apiProjects.map(mapApiProject);
        setProjects(normalizedProjects);
        localStorage.setItem("projects", JSON.stringify(normalizedProjects));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          try {
            const refreshedToken = await resolveAuthToken(true);
            const retryProjects = await fetchProjects(refreshedToken);
            if (!isMounted) {
              return;
            }

            const normalizedProjects = retryProjects.map(mapApiProject);
            setProjects(normalizedProjects);
            localStorage.setItem("projects", JSON.stringify(normalizedProjects));
            setProjectsError(null);
            return;
          } catch (retryError) {
            handleProjectsError(retryError);
            return;
          }
        }

        handleProjectsError(error);
      } finally {
        if (isMounted) {
          setIsProjectsLoading(false);
        }
      }
    };

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, [user.id]);

  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  // Save state whenever it changes
  useEffect(() => {
    localStorage.setItem("currentView", currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem("selectedProject", selectedProject || "null");
  }, [selectedProject]);

  useEffect(() => {
    localStorage.setItem("editingProject", editingProject || "null");
  }, [editingProject]);

  // Save projects state to localStorage
  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    setSelectedProject(null); // Clear selected project when changing views
    setEditingProject(null); // Clear editing project when changing views
  };

  const handleProjectSelection = (projectId: string, source?: string) => {
    setSelectedProject(projectId);
    setSourceView(source || null);
    if (source) {
      setCurrentView(source);
    }
  };

  const handleProjectEdit = (projectId: string) => {
    console.log("DEBUG: Starting edit for project:", projectId);
    setEditingProject(projectId);
    setCurrentView("submit-project");
    setSelectedProject(null);
  };

  const handleProjectUpdate = (
    projectId: string,
    updatedData: Record<string, unknown>,
    newStatus: string
  ) => {
    console.log("handleProjectUpdate called with:", {
      projectId,
      updatedData,
      newStatus,
    });

    setProjects((prevProjects) => {
      const existingProject = prevProjects.find((p) => p.id === projectId);

      if (existingProject) {
        // Update existing project
        console.log("Updating existing project:", existingProject.id);
        return prevProjects.map((project) =>
          project.id === projectId
            ? {
                ...project,
                ...updatedData,
                status: newStatus,
                lastModified: new Date().toLocaleDateString("en-US"),
              }
            : project
        );
      } else {
        // Add new project (create new project with provided data)
        console.log("Creating new project with ID:", projectId);
        const newProject: Project = {
          id: projectId,
          title: (updatedData.title as string) || "Untitled Project",
          type: (updatedData.type as string) || "Capstone",
          status: newStatus,
          submissionDate:
            newStatus === "Under Review"
              ? new Date().toLocaleDateString("en-US")
              : "",
          lastModified: new Date().toLocaleDateString("en-US"),
          impact: "Medium",
          description: (updatedData.description as string) || "",
          students: [user?.name || "Unknown Student"],
          advisor: "Dr. Sarah Lecturer",
          teamName: (updatedData.teamName as string) || "",
          teamMembers: (updatedData.teamMembers as TeamMember[]) || [],
          externalLinks: (updatedData.externalLinks as string[]) || [],
          keywords: (updatedData.keywords as string[]) || [],
          course: (updatedData.course as string) || "",
          year: new Date().getFullYear().toString(),
          semester: "Fall",
          files:
            (updatedData.files as {
              name: string;
              size: string;
              type: string;
            }[]) || [],
          competitionName: (updatedData.competitionName as string) || "",
          award: (updatedData.award as string) || "",
          studentId: user?.email || "",
          studentName: user?.name || "",
          dueDate: (updatedData.dueDate as string) || "",
          competition: (updatedData.competition as string) || "",
          attachments:
            (updatedData.attachments as {
              name: string;
              size: string;
              type: string;
            }[]) || [],
          progress: 0,
        };
        return [...prevProjects, newProject];
      }
    });
  };

  const renderContent = () => {
    if (selectedProject) {
      return (
        <ProjectDetailView
          projectId={selectedProject}
          user={user}
          onBack={() => setSelectedProject(null)}
          projects={projects}
          onProjectUpdate={(updatedProjects) =>
            setProjects(updatedProjects as never)
          }
          isArchiveView={sourceView === "archive"}
        />
      );
    }

    switch (currentView) {
      case "my-projects":
        return (
          <MyProjectsView
            user={user}
            projects={projects}
            isLoading={isProjectsLoading}
            errorMessage={projectsError}
            onViewProject={(id) => handleProjectSelection(id, "my-projects")}
            onEditProject={handleProjectEdit}
          />
        );
      case "submit-project":
        return (
          <ProjectSubmissionForm
            user={user}
            onBack={() => handleViewChange("my-projects")}
            editingProjectId={editingProject}
            projects={projects}
            onProjectUpdate={handleProjectUpdate}
          />
        );
      case "archive":
        return (
          <ProjectArchive
            user={user}
            onViewProject={(id) => handleProjectSelection(id, "archive")}
          />
        );
      case "users":
        return <UserManagement user={user} />;
      case "courses":
        return <CourseManagement user={user} />;
      case "advisor-course":
        return <AdvisorCoursePlaceholder />;
      case "student-roster":
        return <StudentRosterUpload user={user} />;
      case "reports":
        return <ReportingDashboard user={user} />;
      case "rubrics":
        return <RubricManagement user={user} />;
      default:
        return (
          <MyProjectsView
            user={user}
            projects={projects}
            isLoading={isProjectsLoading}
            errorMessage={projectsError}
            onViewProject={(id) => handleProjectSelection(id, "my-projects")}
            onEditProject={handleProjectEdit}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        user={user}
        currentView={currentView}
        onViewChange={handleViewChange}
      />
      <div className="flex-1 flex flex-col">
        <Header user={user} onLogout={onLogout} />
        <main className="flex-1 p-6">{renderContent()}</main>
      </div>
    </div>
  );
};
