import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Eye, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PLO {
  id: string;
  code: string;
  description: string;
  category: string;
}

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  ploIds: string[];
  weight: number;
  levels: RubricLevel[];
}

interface RubricLevel {
  id: string;
  name: string;
  description: string;
  points: number;
}

interface Rubric {
  id: string;
  name: string;
  description: string;
  projectTypes: string[];
  criteria: RubricCriterion[];
  maxPoints: number;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "coordinator" | "advisor";
}

interface RubricManagementProps {
  user: User;
}

// Sample PLOs data
const samplePLOs: PLO[] = [
  { id: "plo1", code: "PLO1", description: "Apply knowledge of computing and mathematics appropriate to the discipline", category: "Knowledge" },
  { id: "plo2", code: "PLO2", description: "Analyze a problem, and identify and define computing requirements", category: "Problem Analysis" },
  { id: "plo3", code: "PLO3", description: "Design, implement, and evaluate computer-based systems", category: "Design/Development" },
  { id: "plo4", code: "PLO4", description: "Function effectively on teams to accomplish a common goal", category: "Teamwork" },
  { id: "plo5", code: "PLO5", description: "Communicate effectively with a range of audiences", category: "Communication" },
  { id: "plo6", code: "PLO6", description: "Analyze local and global impact of computing on individuals and society", category: "Ethics" }
];

// Sample rubrics data
const sampleRubrics: Rubric[] = [
  {
    id: "1",
    name: "Capstone Project Evaluation",
    description: "Comprehensive evaluation rubric for final year capstone projects",
    projectTypes: ["Capstone"],
    criteria: [
      {
        id: "c1",
        name: "Technical Implementation",
        description: "Quality of technical solution and code implementation",
        ploIds: ["plo1", "plo3"],
        weight: 30,
        levels: [
          { id: "l1", name: "Excellent", description: "Exceptional technical implementation", points: 4 },
          { id: "l2", name: "Good", description: "Good technical implementation", points: 3 },
          { id: "l3", name: "Satisfactory", description: "Adequate technical implementation", points: 2 },
          { id: "l4", name: "Needs Improvement", description: "Poor technical implementation", points: 1 }
        ]
      },
      {
        id: "c2",
        name: "Problem Analysis",
        description: "Ability to analyze and define project requirements",
        ploIds: ["plo2"],
        weight: 25,
        levels: [
          { id: "l1", name: "Excellent", description: "Thorough problem analysis", points: 4 },
          { id: "l2", name: "Good", description: "Good problem analysis", points: 3 },
          { id: "l3", name: "Satisfactory", description: "Basic problem analysis", points: 2 },
          { id: "l4", name: "Needs Improvement", description: "Unclear problem analysis", points: 1 }
        ]
      }
    ],
    maxPoints: 100,
    createdBy: "coordinator@university.edu",
    createdAt: "2024-01-15",
    isActive: true
  }
];

export const RubricManagement = ({ user }: RubricManagementProps) => {
  const { toast } = useToast();
  const [rubrics, setRubrics] = useState<Rubric[]>(sampleRubrics);
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("list");

  const [newRubric, setNewRubric] = useState<Partial<Rubric>>({
    name: "",
    description: "",
    projectTypes: [],
    criteria: []
  });

  const [newCriterion, setNewCriterion] = useState<Partial<RubricCriterion>>({
    name: "",
    description: "",
    ploIds: [],
    weight: 10,
    levels: [
      { id: "l1", name: "Excellent", description: "", points: 4 },
      { id: "l2", name: "Good", description: "", points: 3 },
      { id: "l3", name: "Satisfactory", description: "", points: 2 },
      { id: "l4", name: "Needs Improvement", description: "", points: 1 }
    ]
  });

  const projectTypes = ["Capstone", "Competition Work", "Academic Publication", "Social Service", "Other"];

  const addCriterion = () => {
    if (!newCriterion.name || !newCriterion.description) {
      toast({
        title: "Error",
        description: "Please fill in criterion name and description",
        variant: "destructive",
      });
      return;
    }

    const criterion: RubricCriterion = {
      id: Date.now().toString(),
      name: newCriterion.name,
      description: newCriterion.description,
      ploIds: newCriterion.ploIds || [],
      weight: newCriterion.weight || 10,
      levels: newCriterion.levels || []
    };

    setNewRubric(prev => ({
      ...prev,
      criteria: [...(prev.criteria || []), criterion]
    }));

    setNewCriterion({
      name: "",
      description: "",
      ploIds: [],
      weight: 10,
      levels: [
        { id: "l1", name: "Excellent", description: "", points: 4 },
        { id: "l2", name: "Good", description: "", points: 3 },
        { id: "l3", name: "Satisfactory", description: "", points: 2 },
        { id: "l4", name: "Needs Improvement", description: "", points: 1 }
      ]
    });
  };

  const saveRubric = () => {
    if (!newRubric.name || !newRubric.description || !newRubric.criteria?.length) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and add at least one criterion",
        variant: "destructive",
      });
      return;
    }

    const totalWeight = newRubric.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    if (totalWeight !== 100) {
      toast({
        title: "Error",
        description: "Criterion weights must total 100%",
        variant: "destructive",
      });
      return;
    }

    const rubric: Rubric = {
      id: isEditing ? selectedRubric!.id : Date.now().toString(),
      name: newRubric.name,
      description: newRubric.description,
      projectTypes: newRubric.projectTypes || [],
      criteria: newRubric.criteria,
      maxPoints: 100,
      createdBy: user.email,
      createdAt: isEditing ? selectedRubric!.createdAt : new Date().toISOString().split('T')[0],
      isActive: true
    };

    if (isEditing) {
      setRubrics(prev => prev.map(r => r.id === rubric.id ? rubric : r));
    } else {
      setRubrics(prev => [...prev, rubric]);
    }

    setIsCreating(false);
    setIsEditing(false);
    setSelectedRubric(null);
    setNewRubric({ name: "", description: "", projectTypes: [], criteria: [] });
    setActiveTab("list");

    toast({
      title: "Success",
      description: isEditing ? "Rubric updated successfully" : "Rubric created successfully",
    });
  };

  const editRubric = (rubric: Rubric) => {
    setSelectedRubric(rubric);
    setNewRubric(rubric);
    setIsEditing(true);
    setIsCreating(true);
    setActiveTab("create");
  };

  const deleteRubric = (id: string) => {
    setRubrics(prev => prev.filter(r => r.id !== id));
    toast({
      title: "Success",
      description: "Rubric deleted successfully",
    });
  };

  const toggleRubricStatus = (id: string) => {
    setRubrics(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const getPLODisplayName = (ploId: string) => {
    const plo = samplePLOs.find(p => p.id === ploId);
    return plo ? `${plo.code}: ${plo.description}` : ploId;
  };

  if (user.role !== "coordinator") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Only coordinators can manage rubrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Rubric Management</h2>
          <p className="text-muted-foreground">Create and manage evaluation rubrics linked to PLOs</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Rubrics</TabsTrigger>
          <TabsTrigger value="create">
            {isEditing ? "Edit Rubric" : "Create Rubric"}
          </TabsTrigger>
          <TabsTrigger value="plos">PLOs Reference</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => {
              setIsCreating(true);
              setIsEditing(false);
              setNewRubric({ name: "", description: "", projectTypes: [], criteria: [] });
              setActiveTab("create");
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Rubric
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evaluation Rubrics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Project Types</TableHead>
                    <TableHead>Criteria Count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rubrics.map((rubric) => (
                    <TableRow key={rubric.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rubric.name}</p>
                          <p className="text-sm text-muted-foreground">{rubric.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {rubric.projectTypes.map(type => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{rubric.criteria.length}</TableCell>
                      <TableCell>
                        <Badge variant={rubric.isActive ? "default" : "secondary"}>
                          {rubric.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{rubric.createdAt}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>{rubric.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                                <p className="text-sm text-muted-foreground">{rubric.description}</p>
                                {rubric.criteria.map((criterion) => (
                                  <Card key={criterion.id}>
                                    <CardHeader>
                                      <CardTitle className="text-lg flex justify-between">
                                        {criterion.name}
                                        <Badge variant="outline">{criterion.weight}%</Badge>
                                      </CardTitle>
                                      <p className="text-sm text-muted-foreground">{criterion.description}</p>
                                      <div className="flex flex-wrap gap-1">
                                        {criterion.ploIds.map(ploId => {
                                          const plo = samplePLOs.find(p => p.id === ploId);
                                          return (
                                            <Badge key={ploId} variant="secondary" className="text-xs">
                                              {plo?.code}
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {criterion.levels.map((level) => (
                                          <div key={level.id} className="border rounded p-3">
                                            <div className="flex justify-between items-center mb-2">
                                              <h4 className="font-medium">{level.name}</h4>
                                              <Badge variant="outline">{level.points} pts</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{level.description}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="outline" size="sm" onClick={() => editRubric(rubric)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => toggleRubricStatus(rubric.id)}
                          >
                            {rubric.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => deleteRubric(rubric.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? "Edit Rubric" : "Create New Rubric"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rubricName">Rubric Name *</Label>
                  <Input
                    id="rubricName"
                    value={newRubric.name || ""}
                    onChange={(e) => setNewRubric(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter rubric name"
                  />
                </div>
                <div>
                  <Label>Project Types</Label>
                  <Select
                    onValueChange={(value) => {
                      if (!newRubric.projectTypes?.includes(value)) {
                        setNewRubric(prev => ({
                          ...prev,
                          projectTypes: [...(prev.projectTypes || []), value]
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add project types" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newRubric.projectTypes?.map(type => (
                      <Badge key={type} variant="secondary" className="flex items-center space-x-1">
                        <span>{type}</span>
                        <button
                          type="button"
                          onClick={() => setNewRubric(prev => ({
                            ...prev,
                            projectTypes: prev.projectTypes?.filter(t => t !== type)
                          }))}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="rubricDescription">Description *</Label>
                <Textarea
                  id="rubricDescription"
                  value={newRubric.description || ""}
                  onChange={(e) => setNewRubric(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose and scope of this rubric"
                  rows={3}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Add Evaluation Criterion</h3>
                <div className="space-y-4 border rounded p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="criterionName">Criterion Name</Label>
                      <Input
                        id="criterionName"
                        value={newCriterion.name || ""}
                        onChange={(e) => setNewCriterion(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Technical Implementation"
                      />
                    </div>
                    <div>
                      <Label htmlFor="criterionWeight">Weight (%)</Label>
                      <Input
                        id="criterionWeight"
                        type="number"
                        value={newCriterion.weight || 10}
                        onChange={(e) => setNewCriterion(prev => ({ ...prev, weight: parseInt(e.target.value) }))}
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="criterionDescription">Description</Label>
                    <Textarea
                      id="criterionDescription"
                      value={newCriterion.description || ""}
                      onChange={(e) => setNewCriterion(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this criterion evaluates"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Linked PLOs</Label>
                    <Select
                      onValueChange={(value) => {
                        if (!newCriterion.ploIds?.includes(value)) {
                          setNewCriterion(prev => ({
                            ...prev,
                            ploIds: [...(prev.ploIds || []), value]
                          }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Link to PLOs" />
                      </SelectTrigger>
                      <SelectContent>
                        {samplePLOs.map(plo => (
                          <SelectItem key={plo.id} value={plo.id}>
                            {plo.code}: {plo.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newCriterion.ploIds?.map(ploId => {
                        const plo = samplePLOs.find(p => p.id === ploId);
                        return (
                          <Badge key={ploId} variant="secondary" className="flex items-center space-x-1">
                            <span>{plo?.code}</span>
                            <button
                              type="button"
                              onClick={() => setNewCriterion(prev => ({
                                ...prev,
                                ploIds: prev.ploIds?.filter(id => id !== ploId)
                              }))}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label>Performance Levels</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                      {newCriterion.levels?.map((level, index) => (
                        <div key={level.id} className="border rounded p-3">
                          <div className="flex justify-between items-center mb-2">
                            <Input
                              value={level.name}
                              onChange={(e) => {
                                const newLevels = [...(newCriterion.levels || [])];
                                newLevels[index] = { ...level, name: e.target.value };
                                setNewCriterion(prev => ({ ...prev, levels: newLevels }));
                              }}
                              placeholder="Level name"
                              className="text-sm"
                            />
                            <Input
                              type="number"
                              value={level.points}
                              onChange={(e) => {
                                const newLevels = [...(newCriterion.levels || [])];
                                newLevels[index] = { ...level, points: parseInt(e.target.value) };
                                setNewCriterion(prev => ({ ...prev, levels: newLevels }));
                              }}
                              className="w-16 text-sm ml-2"
                              min="0"
                              max="4"
                            />
                          </div>
                          <Textarea
                            value={level.description}
                            onChange={(e) => {
                              const newLevels = [...(newCriterion.levels || [])];
                              newLevels[index] = { ...level, description: e.target.value };
                              setNewCriterion(prev => ({ ...prev, levels: newLevels }));
                            }}
                            placeholder="Level description"
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={addCriterion} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Criterion
                  </Button>
                </div>
              </div>

              {newRubric.criteria && newRubric.criteria.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Current Criteria ({newRubric.criteria.reduce((sum, c) => sum + c.weight, 0)}% total weight)
                  </h3>
                  <div className="space-y-3">
                    {newRubric.criteria.map((criterion) => (
                      <Card key={criterion.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-medium">{criterion.name}</h4>
                                <Badge variant="outline">{criterion.weight}%</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{criterion.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {criterion.ploIds.map(ploId => {
                                  const plo = samplePLOs.find(p => p.id === ploId);
                                  return (
                                    <Badge key={ploId} variant="secondary" className="text-xs">
                                      {plo?.code}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setNewRubric(prev => ({
                                ...prev,
                                criteria: prev.criteria?.filter(c => c.id !== criterion.id)
                              }))}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                    setActiveTab("list");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={saveRubric}>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? "Update Rubric" : "Save Rubric"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plos">
          <Card>
            <CardHeader>
              <CardTitle>Program Learning Outcomes (PLOs)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Reference guide for linking rubric criteria to curriculum outcomes
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {samplePLOs.map((plo) => (
                  <Card key={plo.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start space-x-4">
                        <Badge variant="outline" className="mt-1">{plo.code}</Badge>
                        <div className="flex-1">
                          <p className="font-medium">{plo.description}</p>
                          <Badge variant="secondary" className="mt-2">{plo.category}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};