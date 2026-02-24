
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Download, 
  ExternalLink, 
  User, 
  Calendar, 
  Award,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { downloadProjectFile } from "@/services/projectApi";

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
  impact: string;
  description: string;
  students: string[];
  advisor: string;
  submissionDate: string;
  completionDate: string;
  lastModified: string;
  keywords: string[];
  externalLinks: string[];
  course: string;
  courseCode?: string;
  semester: string;
  year: string;
  teamName?: string;
  teamMembers?: { name: string; isPrimary: boolean; role: string }[];
  files?: { name: string; size: string; type: string }[];
  competitionName?: string;
  award?: string;
  grade?: number;
  feedback?: {
    lecturer?: string;
    coordinator?: string;
    status?: string;
  };
}

interface ProjectDetailViewProps {
  projectId: string;
  user: User;
  onBack: () => void;
  projects?: Project[];
  onProjectUpdate?: (projects: Project[]) => void;
  isArchiveView?: boolean;
}

// Mock project data (in a real app, this would be fetched from API)
const mockProject = {
  id: "1",
  title: "Mobile App for Community Gardens",
  type: "Capstone",
  status: "Completed",
  impact: "High",
  description: "Mobile application to connect community members with local gardens...",
  students: ["John Student", "Jane Doe", "Alex Kim"],
  advisor: "Dr. Sarah Lecturer",
  submissionDate: "2024-03-10",
  completionDate: "2024-03-15",
  lastModified: "2024-03-20",
  keywords: ["AI", "Machine Learning", "Education", "LMS", "Personalization", "Analytics"],
  teamName: "AI Innovation Team",
  course: "1305394",
  courseCode: "1305394",
  semester: "Semester 1",
  year: "2024",
  competitionName: "",
  award: "",
  teamMembers: [],
  externalLinks: [
    "https://github.com/project",
    "https://canva.com"
  ],
  files: [
    { name: "Final_Report.pdf", size: "2.3 MB", type: "PDF" },
    { name: "Presentation.pptx", size: "8.1 MB", type: "PowerPoint" }
  ],
  feedback: {
    lecturer: "Excellent work! The AI integration is innovative and well-implemented. Consider expanding the analytics dashboard for future iterations.",
    coordinator: "Outstanding project with high potential for real-world application. Approved for archive with high impact score.",
    status: "approved",
    impactScore: "High"
  },
  grade: 95
};

export const ProjectDetailView = ({ projectId, user, onBack, projects, onProjectUpdate, isArchiveView = false }: ProjectDetailViewProps) => {
  const { toast } = useToast();
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [grade, setGrade] = useState("");
  const [newComment, setNewComment] = useState("");

  // Find the correct project by ID
  const project = (projects || [mockProject]).find(p => p.id === projectId) || mockProject;

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

  const handleReviewAction = async (action: string) => {
    // Show confirmation dialog for Mark as Complete
    if (action === "approve") {
      const confirmComplete = window.confirm("Are you sure you want to mark this project as complete? This action will finalize the project status.");
      if (!confirmComplete) {
        return;
      }
    }

    // Check if feedback is required for other actions
    if (action !== "approve" && !reviewFeedback.trim() && !newComment.trim()) {
      alert("Please provide feedback before reviewing.");
      return;
    }

    const updatedProject = {
      ...project,
      status: action === "approve" ? "Completed" : action === "reject" ? "Rejected" : "Under Revision",
      feedback: {
        ...project.feedback,
        [user.role === "advisor" ? "advisor" : "coordinator"]: reviewFeedback || newComment || "Project marked as complete by advisor"
      }
    };

    const currentProjects = projects || [mockProject];
    const updatedProjects = currentProjects.map(p => p.id === project.id ? updatedProject : p);
    onProjectUpdate?.(updatedProjects);
    setReviewFeedback("");
    setNewComment("");
    
    // Show success message
    if (action === "approve") {
      alert("Project has been successfully marked as complete!");
    }
    
    // Navigate back after review
    onBack();
  };

  const handleGradeSubmit = () => {
    if (!grade || isNaN(Number(grade)) || Number(grade) < 0 || Number(grade) > 100) {
      alert("Please enter a valid grade between 0 and 100.");
      return;
    }

    const updatedProject: Project = {
      ...project,
      grade: Number(grade)
    };

    const currentProjects = projects || [mockProject];
    const updatedProjects = currentProjects.map(p => p.id === project.id ? updatedProject : p);
    onProjectUpdate?.(updatedProjects);
    setGrade("");
    alert("Grade submitted successfully!");
  };

  const handleCommentSubmit = () => {
    if (!newComment.trim()) {
      alert("Please enter a comment.");
      return;
    }

    const updatedProject = {
      ...project,
      feedback: {
        ...project.feedback,
        [user.role === "advisor" ? "advisor" : "coordinator"]:
          project.feedback?.[user.role === "advisor" ? "advisor" : "coordinator"]
            ? `${project.feedback[user.role === "advisor" ? "advisor" : "coordinator"]}\n\n[${new Date().toLocaleDateString()}] ${newComment}`
            : `[${new Date().toLocaleDateString()}] ${newComment}`
      }
    };

    const currentProjects = projects || [mockProject];
    const updatedProjects = currentProjects.map(p => p.id === project.id ? updatedProject : p);
    onProjectUpdate?.(updatedProjects);
    setNewComment("");
    alert("Comment added successfully!");
  };

  const handleSubmitFeedback = () => {
    if (!reviewFeedback.trim()) {
      alert("Please enter your feedback before submitting.");
      return;
    }

    const updatedProject = {
      ...project,
      feedback: {
        ...project.feedback,
        lecturer: reviewFeedback
      }
    };

    const currentProjects = projects || [mockProject];
    const updatedProjects = currentProjects.map(p => p.id === project.id ? updatedProject : p);
    onProjectUpdate?.(updatedProjects);
    setReviewFeedback("");
    alert("Feedback submitted successfully!");
  };

  const canReviewProject = () => {
    return (user.role === "advisor" && (project.status === "Submitted" || project.status === "Under Review")) ||
           (user.role === "coordinator" && project.status === "Under Review");
  };

  const isOwnProject = () => {
    return user.role === "student" && project.students.includes(user.name);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back  
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
            <p className="text-gray-600 mt-1">Project Details</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(project.status)}>
            {getStatusDisplayName(project.status)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700 leading-relaxed">{project.description}</p>
              </div>

              {/* External Links */}
              {project.externalLinks.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">External Links</h4>
                  <div className="space-y-2">
                    {project.externalLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Files and Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Files & Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {project.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {file.size} • {file.type}
                          {file.downloadable === false && (
                            <span className="ml-2 text-amber-500">(metadata only)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={file.downloadable === false}
                      onClick={async () => {
                        if (file.downloadable === false) {
                          toast({
                            title: "File not available",
                            description: "This file record is metadata only — the actual file was not uploaded to storage.",
                          });
                          return;
                        }
                        try {
                          const token = await auth.currentUser?.getIdToken();
                          if (!token) {
                            toast({
                              title: "Authentication required",
                              description: "Please sign in to download files.",
                              variant: "destructive",
                            });
                            return;
                          }
                          await downloadProjectFile(project.id, file.name, token);
                        } catch {
                          toast({
                            title: "Download failed",
                            description: "Unable to download the file. It may not have been uploaded yet.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {file.downloadable === false ? "Unavailable" : "Download"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Feedback & Reviews Section for Completed Projects */}
          {(project.status === "Approved" || project.status === "Completed" || project.status === "Rejected" || getStatusDisplayName(project.status) === "Deny") && (
            <Card>
              <CardHeader>
                <CardTitle>Feedback & Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {project.feedback?.lecturer && (
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Advisor Feedback</h4>
                    <p className="text-gray-700 leading-relaxed">{project.feedback.lecturer}</p>
                  </div>
                )}
                {project.feedback?.coordinator && (
                  <div className="border-l-4 border-green-500 pl-4 mt-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Coordinator Review</h4>
                    <p className="text-gray-700 leading-relaxed">{project.feedback.coordinator}</p>
                  </div>
                )}
                {/* Default feedback if no specific feedback exists */}
                {!project.feedback?.lecturer && !project.feedback?.coordinator && (
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Advisor Feedback</h4>
                    <p className="text-gray-700 leading-relaxed">
                      {project.status === "Approved" || project.status === "Completed" 
                        ? "Excellent work! The AI integration is innovative and well-implemented. Consider expanding the analytics dashboard for future iterations."
                        : "This project requires revision. Please address the feedback provided and resubmit for review."
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit Feedback Section - Only for advisors reviewing projects */}
          {user.role === "advisor" && !isArchiveView && project.status === "Under Review" && (
            <Card>
              <CardHeader>
                <CardTitle>Submit Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Feedback
                  </label>
                  <Textarea
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    placeholder="Share your thoughts about the project..."
                    rows={6}
                    className="w-full resize-none"
                  />
                </div>
                <Button
                  onClick={() => handleSubmitFeedback()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Submit Feedback
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Deny and Approve Buttons - Outside Feedback Card */}
          {user.role === "advisor" && !isArchiveView && project.status === "Under Review" && (
            <div className="flex space-x-3">
              <Button
                onClick={() => handleReviewAction("deny")}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Deny
              </Button>
              <Button
                onClick={() => handleReviewAction("approve")}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approved
              </Button>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{project.type}</Badge>
              </div>

              <Separator />

              <div className="space-y-3">
                {/* Team Name */}
                {project.teamName && (
                  <div className="text-sm">
                    <p className="font-medium">Team Name</p>
                    <p className="text-gray-600">{project.teamName}</p>
                  </div>
                )}

                {/* Competition Information */}
                {project.type === "Competition Work" && (
                  <>
                    {project.competitionName && (
                      <div className="text-sm">
                        <p className="font-medium">Competition</p>
                        <p className="text-gray-600">{project.competitionName}</p>
                      </div>
                    )}
                    {project.award && (
                      <div className="text-sm">
                        <p className="font-medium">Award/Recognition</p>
                        <p className="text-gray-600">{project.award}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Dates */}
                {project.completionDate && (
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <p className="font-medium">Completed</p>
                      <p className="text-gray-600">
                        {project.completionDate === "Invalid Date" ? "Not specified" : new Date(project.completionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {project.submissionDate && (
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <p className="font-medium">Submitted</p>
                      <p className="text-gray-600">
                        {project.submissionDate === "Invalid Date" || !project.submissionDate ? "Not submitted yet" : new Date(project.submissionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-sm">
                  <p className="font-medium">Course Code</p>
                  <p className="text-gray-600">{project.courseCode || project.course}</p>
                </div>

                <div className="text-sm">
                  <p className="font-medium">Semester</p>
                  <p className="text-gray-600">{project.semester}</p>
                </div>

                <div className="text-sm">
                  <p className="font-medium">Last Modified</p>
                  <p className="text-gray-600">{project.lastModified}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team & Advisors */}
          <Card>
            <CardHeader>
              <CardTitle>Team & Advisors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Students */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Students</h4>
                <div className="space-y-2">
                  {project.students.map((student, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{student}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Advisor</h4>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{project.advisor}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grade Section */}
          {canReviewProject() && (
            <Card>
              <CardHeader>
                <CardTitle>Grade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="text"
                  placeholder="Add grade for this project"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full"
                />
                <Button
                  onClick={() => handleGradeSubmit()}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Submit
                </Button>
                {project.grade && (
                  <div className="text-sm text-gray-600">
                    Current Grade: <span className="font-semibold">{project.grade}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new comment - at the top (only if not in archive view) */}
              {!isArchiveView && (
                <div className="flex space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="w-full resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleCommentSubmit()}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing comments */}
              <div className="space-y-4">
                {/* Dr. Sarah Lecturer comment */}
                <div className="flex space-x-3">
                  <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">Dr. Sarah Lecturer</div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-2">
                      Great progress on the project! Looking forward to the final presentation.
                    </p>
                    <div className="text-xs text-gray-500">2 days ago</div>
                  </div>
                </div>

                {/* Jane Doe comment */}
                <div className="flex space-x-3">
                  <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">Jane Doe</div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-2">
                      Thanks for the feedback! We are working on the analytics dashboard improvements.
                    </p>
                    <div className="text-xs text-gray-500">1 day ago</div>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
