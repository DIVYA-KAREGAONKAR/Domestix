import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";
import { 
  Briefcase, MapPin, DollarSign, Calendar, ArrowLeft, Save, Send 
} from "lucide-react";

const PostJob = () => {
  const { user, isAuthenticated, isEmployer } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [jobData, setJobData] = useState({
    title: "",
    description: "",
    requirements: "",
    hourlyRate: "",
    salaryType: "hourly",
    jobType: "",
    location: "",
    city: "",
    state: "",
    zipCode: "",
    startDate: "",
    duration: "",
    hoursPerWeek: "",
    skills: [] as string[],
    schedule: [] as string[],
    isUrgent: false,
    isLiveIn: false,
    providesTransportation: false,
    petFriendly: false
  });

  useEffect(() => {
    if (!isAuthenticated || !isEmployer) {
      navigate('/employer/login');
    }
  }, [isAuthenticated, isEmployer, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setJobData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (category: 'skills' | 'schedule', value: string) => {
    setJobData(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ✅ Payload mapping to match your Django Choices
      const payload = {
        title: jobData.title,
        description: jobData.description,
        salary: jobData.hourlyRate, 
        location: `${jobData.location}, ${jobData.city}, ${jobData.state}`,
        job_type: jobData.jobType || "full-time", // Fallback to avoid 400
        status: "active"
      };

      // ✅ FIX: Send 'payload' instead of 'FormData'
      const response = await api.post("/employer/jobs/", payload);
      
      toast({
        title: "Job Posted Successfully!",
        description: "Your job posting is now live.",
      });
      
      navigate('/employer/dashboard');
    } catch (error: any) {
      console.error("Submission error details:", error.response?.data);
      toast({
        title: "Submission Failed",
        description: error.response?.data?.title?.[0] || "Please check all fields.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-app-bg">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/employer/dashboard" className="flex items-center text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Link>
          <span className="font-semibold">Create New Job Posting</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Job Title</Label>
                <Input id="title" name="title" value={jobData.title} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={jobData.description} onChange={handleInputChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Job Type</Label>
                  <Select onValueChange={(v) => setJobData(p => ({ ...p, jobType: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="one-time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Salary ($)</Label>
                  <Input name="hourlyRate" type="number" value={jobData.hourlyRate} onChange={handleInputChange} required />
                </div>
              </div>
              <div>
                <Label htmlFor="location">General Location</Label>
                <Input id="location" name="location" value={jobData.location} onChange={handleInputChange} placeholder="e.g. Downtown" required />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="submit" className="bg-primary text-white px-8" disabled={isLoading}>
              {isLoading ? "Processing..." : "Publish Job"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJob;