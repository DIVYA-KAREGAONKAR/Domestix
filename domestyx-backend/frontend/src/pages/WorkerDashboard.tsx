import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api"; 
import { Search, MapPin, IndianRupee, CheckCircle, Filter, Clock } from "lucide-react";

const WorkerDashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'browse' | 'applied'>('browse');
  const [jobs, setJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/worker/available-jobs/", {
        params: {
          search: searchQuery,
          category: category !== "all" ? category : ""
        }
      }); 
      setJobs(response.data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load jobs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/worker/my-applications/");
      setAppliedJobs(response.data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load applications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/worker/login');
      return;
    }

    if (activeTab === 'browse') {
      fetchJobs();
    } else {
      fetchAppliedJobs();
    }
  }, [isAuthenticated, activeTab, category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleApply = async (jobId: number) => {
    try {
      await api.post(`/jobs/${jobId}/apply/`); 
      toast({ title: "Success", description: "Application sent!" });
      fetchJobs(); 
    } catch (err) {
      toast({ title: "Error", description: "Application failed.", variant: "destructive" });
    }
  };

  // ✅ Updated to match Backend status choices
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'hired': 
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': 
        return 'bg-red-100 text-red-700 border-red-200';
      case 'applied': 
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default: 
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'hired') return 'ACCEPTED';
    return status.toUpperCase();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary">DomestyX</Link>
          <div className="flex items-center space-x-4">
            <Link to="/worker/profile"><Button variant="ghost" size="sm">Profile</Button></Link>
            <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Worker Dashboard</h1>
            <div className="flex bg-gray-200 p-1 rounded-lg">
                <Button 
                    variant={activeTab === 'browse' ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => setActiveTab('browse')}
                    className={activeTab === 'browse' ? "bg-white shadow-sm hover:bg-white" : ""}
                >
                    Browse Jobs
                </Button>
                <Button 
                    variant={activeTab === 'applied' ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => setActiveTab('applied')}
                    className={activeTab === 'applied' ? "bg-white shadow-sm hover:bg-white" : ""}
                >
                    My Applications
                </Button>
            </div>
        </div>

        {activeTab === 'browse' ? (
          <>
            <div className="mb-8 flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search jobs..." 
                    className="pl-10 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full md:w-[200px] bg-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="babysitting">Babysitting</SelectItem>
                  <SelectItem value="cooking">Cooking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {loading ? (
                <p className="text-center py-10 text-gray-500">Loading jobs...</p>
              ) : jobs.length === 0 ? (
                <Card className="p-10 text-center text-gray-400">No jobs available right now.</Card>
              ) : jobs.map((job: any) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">{job.title}</h3>
                        <Badge variant="outline" className="capitalize">{job.job_type}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center"><IndianRupee className="h-4 w-4 mr-1 text-green-600" />{job.salary}</span>
                        <span className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-red-400" />{job.location}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleApply(job.id)} 
                      disabled={job.has_applied}
                      className={job.has_applied ? "bg-slate-100 text-slate-400 border" : ""}
                    >
                      {job.has_applied ? <><CheckCircle className="h-4 w-4 mr-2"/> Applied</> : "Apply Now"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <p className="text-center py-10 text-gray-500">Loading your applications...</p>
            ) : appliedJobs.length === 0 ? (
              <Card className="p-12 text-center text-gray-400">You haven't applied to any jobs yet.</Card>
            ) : appliedJobs.map((app: any) => (
              <Card key={app.id} className="border-l-4 border-l-primary">
                <CardContent className="p-6 flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold">{app.job_details?.title || "Position Title"}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-3 w-3 mr-1" /> 
                      Applied on {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>
                  {/* ✅ Dynamic Badge Labels and Colors */}
                  <Badge className={`px-4 py-1 border shadow-sm ${getStatusStyles(app.status)}`}>
                    {getStatusLabel(app.status)}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkerDashboard;