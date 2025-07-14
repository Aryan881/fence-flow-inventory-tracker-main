import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, User, Plus, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  manager_id?: number;
  manager_name?: string;
  manager_agency?: string;
  created_at: string;
  updated_at: string;
}

interface Manager {
  id: number;
  name: string;
  agency_name?: string;
  role: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  budget: string;
  manager_id: string;
}

export const ProjectsList = () => {
  const { apiFetch } = useApi();
  const [projects, setProjects] = useState<Project[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    status: "planning",
    start_date: "",
    end_date: "",
    budget: "",
    manager_id: ""
  });
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; projectId: number | null }>({ open: false, projectId: null });

  // Fetch projects from backend
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        toast.error("Failed to fetch projects");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch managers from backend
  const fetchManagers = async () => {
    try {
      const response = await apiFetch("/users?role=agency");
      if (response.ok) {
        const data = await response.json();
        setManagers(data.users || []);
      } else {
        console.error("Failed to fetch managers");
      }
    } catch (error) {
      console.error("Network error fetching managers");
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchManagers();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "planning",
      start_date: "",
      end_date: "",
      budget: "",
      manager_id: ""
    });
  };

  // Add new project
  const handleAddProject = async () => {
    try {
      const response = await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          status: formData.status,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          manager_id: formData.manager_id ? parseInt(formData.manager_id) : null
        })
      });

      if (response.ok) {
        toast.success("Project added successfully");
        setShowAdd(false);
        resetForm();
        fetchProjects();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add project");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  // Edit project
  const handleEditProject = async () => {
    if (!selectedProject) return;
    
    try {
      const response = await apiFetch(`/projects/${selectedProject.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          status: formData.status,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          manager_id: formData.manager_id ? parseInt(formData.manager_id) : null
        })
      });

      if (response.ok) {
        toast.success("Project updated successfully");
        setShowEdit(false);
        resetForm();
        fetchProjects();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update project");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  // Delete project
  const handleDeleteProject = async (projectId: number) => {
    try {
      const response = await apiFetch(`/projects/${projectId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast.success("Project deleted successfully");
        fetchProjects();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete project");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  // Open edit modal
  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      status: project.status,
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      budget: project.budget?.toString() || "",
      manager_id: project.manager_id?.toString() || ""
    });
    setShowEdit(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "planning": return "bg-yellow-100 text-yellow-800";
      case "on_hold": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "completed": return "Completed";
      case "in_progress": return "In Progress";
      case "planning": return "Planning";
      case "on_hold": return "On Hold";
      default: return status;
    }
  };

  const statusCounts = {
    planning: projects.filter(p => p.status === "planning").length,
    in_progress: projects.filter(p => p.status === "in_progress").length,
    completed: projects.filter(p => p.status === "completed").length,
    on_hold: projects.filter(p => p.status === "on_hold").length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
          <Button disabled className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add New Project
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
        <Button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New Project
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700">{statusCounts.planning}</div>
            <div className="text-sm text-yellow-600">Planning</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{statusCounts.in_progress}</div>
            <div className="text-sm text-blue-600">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{statusCounts.completed}</div>
            <div className="text-sm text-green-600">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{statusCounts.on_hold}</div>
            <div className="text-sm text-red-600">On Hold</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <div className="grid gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    {project.manager_name && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {project.manager_name}
                      </div>
                    )}
                    {project.start_date && project.end_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                      </div>
                    )}
                    {project.budget && (
                      <div className="flex items-center gap-1">
                        <span>${project.budget.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Badge className={getStatusColor(project.status)}>
                  {getStatusDisplay(project.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {project.description && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600">Description</div>
                  <div className="text-sm">{project.description}</div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditModal(project)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setSelectedProject(project); setShowDetails(true); }}>
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setConfirmDelete({ open: true, projectId: project.id })}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
            <DialogDescription>
              {selectedProject && (
                <div className="space-y-2 mt-2">
                  <div><b>Name:</b> {selectedProject.name}</div>
                  <div><b>Status:</b> {getStatusDisplay(selectedProject.status)}</div>
                  <div><b>Manager:</b> {selectedProject.manager_name || "N/A"}</div>
                  <div><b>Agency:</b> {selectedProject.manager_agency || "N/A"}</div>
                  <div><b>Start Date:</b> {selectedProject.start_date ? new Date(selectedProject.start_date).toLocaleDateString() : "N/A"}</div>
                  <div><b>End Date:</b> {selectedProject.end_date ? new Date(selectedProject.end_date).toLocaleDateString() : "N/A"}</div>
                  <div><b>Budget:</b> {selectedProject.budget ? `$${selectedProject.budget.toLocaleString()}` : "N/A"}</div>
                  <div><b>Description:</b> {selectedProject.description || "N/A"}</div>
                  <div><b>Created:</b> {new Date(selectedProject.created_at).toLocaleDateString()}</div>
                  <div><b>Updated:</b> {new Date(selectedProject.updated_at).toLocaleDateString()}</div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowDetails(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Project Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="manager_id">Manager</Label>
                <Select value={formData.manager_id} onValueChange={(value) => handleInputChange("manager_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Manager</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id.toString()}>
                        {manager.name} {manager.agency_name && `(${manager.agency_name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange("start_date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange("end_date", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => handleInputChange("budget", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddProject}>Add Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Modal */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Project Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-manager_id">Manager</Label>
                <Select value={formData.manager_id} onValueChange={(value) => handleInputChange("manager_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Manager</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id.toString()}>
                        {manager.name} {manager.agency_name && `(${manager.agency_name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-start_date">Start Date</Label>
                <Input
                  id="edit-start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange("start_date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-end_date">End Date</Label>
                <Input
                  id="edit-end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange("end_date", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-budget">Budget</Label>
              <Input
                id="edit-budget"
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => handleInputChange("budget", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEdit(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEditProject}>Update Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete.open}
        title="Delete Project?"
        description="Are you sure you want to delete this project? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setConfirmDelete({ open: false, projectId: null })}
        onConfirm={() => {
          if (confirmDelete.projectId) handleDeleteProject(confirmDelete.projectId);
          setConfirmDelete({ open: false, projectId: null });
        }}
      />
    </div>
  );
};