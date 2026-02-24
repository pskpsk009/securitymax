import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Download, Users, AlertCircle, CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchCourses, CourseDto, fetchCourseRoster, upsertCourseRoster, deleteCourseRosterEntry, UpsertRosterInputDto } from "@/services/courseApi";
import { auth } from "@/lib/firebase";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "coordinator" | "advisor";
}

interface Course {
  id: string;
  courseCode: string;
  title: string;
  semester: string;
  year: string;
}

interface StudentRecord {
  id: string;
  studentId: string;
  name: string;
  email: string;
  year: string;
  status: "active" | "enrolled" | "error";
  errorMessage?: string;
}

interface StudentRosterUploadProps {
  user: User;
}

export const StudentRosterUpload = ({ user }: StudentRosterUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [uploadedStudents, setUploadedStudents] = useState<StudentRecord[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    total: number;
    successful: number;
    failed: number;
  } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Fetch courses from backend
  useEffect(() => {
    const loadCourses = async () => {
      setIsLoadingCourses(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to view courses.",
            variant: "destructive",
          });
          return;
        }

        const token = await currentUser.getIdToken();
        const coursesData = await fetchCourses(token);
        
        const formattedCourses: Course[] = coursesData.map((c) => ({
          id: c.id,
          courseCode: c.courseCode,
          title: c.courseCode, // Using courseCode as title since backend doesn't provide title
          semester: c.semester,
          year: c.year,
        }));
        
        setCourses(formattedCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast({
          title: "Error",
          description: "Failed to load courses. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCourses(false);
      }
    };

    loadCourses();
  }, [toast]);

  // Fetch existing roster when course is selected
  useEffect(() => {
    const loadRoster = async () => {
      if (!selectedCourse) {
        setUploadedStudents([]);
        setUploadResults(null);
        return;
      }

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const token = await currentUser.getIdToken();
        const roster = await fetchCourseRoster(selectedCourse, token);
        
        const mappedStudents: StudentRecord[] = roster.map((r) => ({
          id: String(r.id),
          studentId: r.student_id,
          name: r.name,
          email: r.email,
          year: r.year ?? "",
          status: "enrolled",
        }));

        setUploadedStudents(mappedStudents);
        
        if (mappedStudents.length > 0) {
          setUploadResults({
            total: mappedStudents.length,
            successful: mappedStudents.length,
            failed: 0,
          });
        }
      } catch (error) {
        console.error("Error fetching roster:", error);
        setUploadedStudents([]);
        setUploadResults(null);
      }
    };

    loadRoster();
  }, [selectedCourse]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedCourse) {
      toast({
        title: "Course Required",
        description: "Please select a course before uploading the roster.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error("File must contain at least a header row and one data row");
        }

        // Parse CSV (assuming format: Student ID, Name, Email, Year)
        const studentsToUpload: UpsertRosterInputDto[] = [];
        const headers = lines[0].split(',').map(h => h.trim());
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          
          if (values.length >= 3) {
            const studentId = values[0] || `STU${Date.now()}${i}`;
            const name = values[1] || "Unknown Student";
            const email = values[2] || "";
            const year = values[3] || new Date().getFullYear().toString();

            // Basic validation
            if (email.includes('@')) {
              studentsToUpload.push({
                studentId,
                name,
                email,
                year,
              });
            }
          }
        }

        if (studentsToUpload.length === 0) {
          throw new Error("No valid students found in CSV file");
        }

        // Upload to backend
        await uploadRosterToBackend(studentsToUpload);
        
      } catch (error) {
        toast({
          title: "Upload Error",
          description: error instanceof Error ? error.message : "Failed to parse the file",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
  };

  const uploadRosterToBackend = async (students: UpsertRosterInputDto[]) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
  const removeStudent = async (studentId: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      const token = await currentUser.getIdToken();
      
      // Find the student to get their student_id
      const student = uploadedStudents.find(s => s.id === studentId);
      if (!student) return;

      // Delete from backend
      await deleteCourseRosterEntry(selectedCourse, student.studentId, token);

      // Update local state
      setUploadedStudents(prev => prev.filter(s => s.id !== studentId));

      // Update results
      setUploadResults(prev => {
        if (!prev) return null;
        return {
          ...prev,
          total: prev.total - 1,
          successful: prev.successful - 1,
        };
      });

      toast({
        title: "Student Removed",
        description: `${student.name} has been removed from the roster.`,
      });

    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to remove student",
        variant: "destructive",
      });
    }
  };
      const token = await currentUser.getIdToken();

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Upload to backend
      const uploadedRoster = await upsertCourseRoster(selectedCourse, students, token);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Map response to StudentRecord format
      const mappedStudents: StudentRecord[] = uploadedRoster.map((r) => ({
        id: String(r.id),
        studentId: r.student_id,
        name: r.name,
        email: r.email,
        year: r.year ?? "",
        status: "enrolled",
      }));

      setUploadedStudents(mappedStudents);
      setUploadResults({
        total: students.length,
        successful: uploadedRoster.length,
        failed: students.length - uploadedRoster.length,
      });

      toast({
        title: "Upload Complete",
        description: `Successfully enrolled ${uploadedRoster.length} students.`,
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload roster",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "Student ID,Name,Email,Year\nSTU001,John Doe,john.doe@university.edu,2024\nSTU002,Jane Smith,jane.smith@university.edu,2024";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'student_roster_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const removeStudent = (studentId: string) => {
    setUploadedStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "enrolled":
        return <Badge className="bg-green-100 text-green-800">Enrolled</Badge>;
      case "error":
              <div>
                <Label htmlFor="course-select">Select Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={isLoadingCourses}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingCourses ? "Loading courses..." : "Choose a course"} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.courseCode} - Semester {course.semester} {course.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>me="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Roster
              </CardTitle>
              <CardDescription>
                Select a course and upload the student roster file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="course-select">Select Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.courseCode} - {course.title} ({course.semester} {course.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="file-upload">Upload CSV File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  disabled={!selectedCourse}
                />
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Label>Upload Progress</Label>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-gray-600">{uploadProgress}% complete</p>
                </div>
              )}

              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </CardContent>
          </Card>

          {uploadResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Upload Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Students:</span>
                    <span className="font-medium">{uploadResults.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Successfully Enrolled:</span>
                    <span className="font-medium text-green-600">{uploadResults.successful}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed:</span>
                    <span className="font-medium text-red-600">{uploadResults.failed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>CSV Format:</strong> The file should contain columns for Student ID, Name, Email, and Year. 
              Use the template above for the correct format.
            </AlertDescription>
          </Alert>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Uploaded Students
                {uploadedStudents.length > 0 && (
                  <Badge variant="secondary">{uploadedStudents.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Review and manage uploaded student data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadedStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No students uploaded yet</p>
                  <p className="text-sm">Select a course and upload a CSV file to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadedStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.studentId}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.year}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(student.status)}
                            {student.errorMessage && (
                              <p className="text-xs text-red-600">{student.errorMessage}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeStudent(student.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};