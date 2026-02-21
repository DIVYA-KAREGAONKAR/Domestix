
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { 
  User, 
  Briefcase, 
  Users, 
  Calendar, 
  MapPin, 
  LogOut,
  Settings,
  Star,
  Clock,
  Plus,
  Eye,
  Edit,
  IndianRupee
} from "lucide-react";

const EmployerDashboard = () => {
  const { user, logout, isAuthenticated} = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: "House Cleaning",
      salary: "₹400/hour",
      location: "Bandra, Mumbai",
      type: "Part-time",
      status: "active",
      applications: 8,
      description: "Weekly house cleaning for a 3-bedroom apartment",
      posted: "2 days ago"
    },
    {
      id: 2,
      title: "Babysitting",
      salary: "₹350/hour",
      location: "Koramangala, Bangalore",
      type: "Weekends",
      status: "active",
      applications: 12,
      description: "Weekend babysitting for 2 children (ages 5 and 8)",
      posted: "1 week ago"
    },
    {
      id: 3,
      title: "Elder Care",
      salary: "₹500/hour",
      location: "Connaught Place, Delhi",
      type: "Full-time",
      status: "filled",
      applications: 5,
      description: "Companion care for elderly gentleman",
      posted: "3 days ago"
    }
  ]);

  useEffect(() => {
    if (!isAuthenticated ) {
      navigate('/employer/login');
    }
  }, [isAuthenticated,  navigate]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-success border-success">Active</Badge>;
      case 'filled':
        return <Badge variant="outline" className="text-primary border-primary">Filled</Badge>;
      case 'paused':
        return <Badge variant="outline" className="text-accent border-accent">Paused</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header */}
      <header className="bg-app-bg shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-2xl font-bold text-primary">
                DomestyX
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">Employer Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/employer/post-job">
                <Button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Post Job
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback className="bg-primary text-white text-lg">
                {user.first_name.charAt(0)}{user.last_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-app-text">
                Welcome back, {user.first_name}!
              </h1>
              <p className="text-gray-600">Manage your job postings and find the perfect workers</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">2 receiving applications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">25</div>
              <p className="text-xs text-muted-foreground">+8 this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hires Made</CardTitle>
              <Star className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your job postings and applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Link to="/employer/post-job">
                <Button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
              </Link>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                View Applications
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Interviews
              </Button>
              <Button variant="outline">
                <Star className="h-4 w-4 mr-2" />
                Manage Reviews
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Job Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Your Job Postings</CardTitle>
            <CardDescription>Manage and track your posted jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Briefcase className="h-4 w-4" />
                        <h3 className="text-lg font-semibold text-app-text">{job.title}</h3>
                        {getStatusBadge(job.status)}
                      </div>
                      <p className="text-gray-600 mb-2">{job.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          {job.salary}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.location}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {job.applications} applications
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {job.posted}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      <Badge variant="secondary">{job.type}</Badge>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                      {job.applications > 0 && (
                        <Button size="sm" className="btn-primary">
                          View Applications ({job.applications})
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link to="/employer/post-job">
                <Button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Post Another Job
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployerDashboard;
