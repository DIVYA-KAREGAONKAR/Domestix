import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api"; 
import { 
  Briefcase, Users, LogOut, Plus, MapPin, Trash2, History 
} from "lucide-react";

const EmployerDashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [history, setHistory] = useState([]);

  const fetchMyJobs = async () => {
    try {
      const response = await api.get("/employer/jobs/"); 
      const jobsData = response.data;
      setJobs(jobsData);
      
      // ✅ Auto-select the first job so applicants are visible immediately
      if (jobsData.length > 0 && !selectedJob) {
        setSelectedJob(jobsData[0]);
      } else if (selectedJob) {
        const updated = jobsData.find((j: any) => j.id === selectedJob.id);
        if (updated) setSelectedJob(updated);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch jobs", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get("/employer/application-history/");
      setHistory(response.data);
    } catch (err) {
      console.error("History fetch failed");
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/employer/login');
      return;
    }
    viewMode === 'active' ? fetchMyJobs() : fetchHistory();
  }, [isAuthenticated, viewMode]);

  const handleStatusUpdate = async (applicationId: number, status: 'accepted' | 'rejected') => {
    try {
      await api.patch(`/applications/${applicationId}/status/`, { status });
      toast({ title: "Success", description: `Applicant ${status} successfully.` });
      fetchMyJobs(); 
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!window.confirm("Delete this job and all its applications?")) return;
    try {
      await api.delete(`/employer/jobs/${jobId}/delete/`);
      toast({ title: "Deleted", description: "Job removed." });
      if (selectedJob?.id === jobId) setSelectedJob(null);
      fetchMyJobs();
    } catch (error) {
      toast({ title: "Error", description: "Delete failed.", variant: "destructive" });
    }
  };

  if (!user || isLoading) return <div className="p-10 text-center font-medium">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-20 px-4 h-16 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link to="/" className="text-2xl font-bold text-primary">DomestyX</Link>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">Employer Portal</Badge>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => navigate('/employer/post-job')} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Post Job
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/'); }}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Welcome, {user.first_name}!</h1>
          <div className="bg-gray-200 p-1 rounded-lg flex space-x-1">
            <Button 
              variant={viewMode === 'active' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('active')}
              className={viewMode === 'active' ? "bg-white shadow-sm" : ""}
            >
              <Briefcase className="w-4 h-4 mr-2" /> Active
            </Button>
            <Button 
              variant={viewMode === 'history' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('history')}
              className={viewMode === 'history' ? "bg-white shadow-sm" : ""}
            >
              <History className="w-4 h-4 mr-2" /> History
            </Button>
          </div>
        </div>

        {viewMode === 'active' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-semibold text-lg text-slate-700">Your Job Postings</h2>
              {jobs.length === 0 ? (
                <div className="p-12 border-2 border-dashed rounded-xl text-center text-slate-400">No jobs posted yet.</div>
              ) : jobs.map((job: any) => (
                <Card 
                  key={job.id} 
                  onClick={() => setSelectedJob(job)} 
                  className={`cursor-pointer transition-all border-l-4 ${
                    selectedJob?.id === job.id ? 'border-primary shadow-md bg-white' : 'border-transparent'
                  }`}
                >
                  <CardContent className="p-5 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">{job.title}</h3>
                      <div className="flex space-x-4 text-sm text-slate-500 mt-1">
                        <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> {job.applicants?.length || 0} applicants</span>
                        <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {job.location}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id); }}>
                      <Trash2 className="w-4 h-4 text-slate-300 hover:text-red-500" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-1">
              <h2 className="font-semibold text-lg text-slate-700 mb-4">Applicant Review</h2>
              {!selectedJob ? (
                <div className="p-8 border-2 border-dashed rounded-xl text-center text-slate-400">Select a job to see applicants.</div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 mb-4">
                    <p className="text-xs font-bold text-primary uppercase">Reviewing for:</p>
                    <p className="font-bold text-slate-800">{selectedJob.title}</p>
                  </div>
                  {selectedJob.applicants?.length === 0 ? (
                    <div className="p-8 bg-slate-100 rounded-xl text-center text-slate-400">No applicants yet.</div>
                  ) : selectedJob.applicants.map((app: any) => (
                    <Card key={app.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <Avatar>
                            <AvatarImage src={app.worker_details?.profile_image} />
                            <AvatarFallback className="bg-slate-200">{app.worker_details?.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-sm text-slate-900">{app.worker_details?.name}</p>
                            <p className="text-xs text-slate-500">{app.worker_details?.experience || 'No experience listed'}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {app.status === 'applied' || app.status === 'pending' ? (
                            <>
                              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate(app.id, 'accepted')}>Accept</Button>
                              <Button size="sm" variant="outline" className="flex-1 text-red-600 hover:bg-red-50" onClick={() => handleStatusUpdate(app.id, 'rejected')}>Reject</Button>
                            </>
                          ) : (
                            <Badge className={`w-full justify-center py-1 ${app.status === 'hired' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {app.status === 'hired' ? 'ACCEPTED' : app.status.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg text-slate-700">Decision History</h2>
            {history.length === 0 ? (
              <Card className="p-12 text-center text-slate-400">No past decisions recorded.</Card>
            ) : history.map((item: any) => (
              <Card key={item.id} className="p-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={item.worker_details?.profile_image} />
                    <AvatarFallback>{item.worker_details?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-slate-900">{item.worker_details?.name}</p>
                    <p className="text-sm text-slate-500">Job: {item.job_details?.title}</p>
                  </div>
                </div>
                <Badge variant={item.status === 'hired' ? 'default' : 'destructive'}>
                  {item.status === 'hired' ? 'ACCEPTED' : item.status.toUpperCase()}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default EmployerDashboard;