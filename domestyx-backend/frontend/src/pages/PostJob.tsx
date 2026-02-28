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
 salary: "",
 jobType: "",
 location: "",
 preferredGender: "",
 preferredAgeRange: "",
 languageRequirements: "",
 experienceRequired: "",
 skillsRequired: "",
 workplaceType: "",
 accommodationProvided: "",
 foodProvided: "",
 workSchedule: "",
 fullTimeSalary: "",
 partTimeSalary: "",
 hourlyWage: "",
 additionalBenefits: "",
 contractType: "",
 recruitmentMethod: "",
 workPermitSponsorship: "",
 backgroundVerificationRequired: false,
 preferredNationality: "",
 policeClearanceRequired: false,
 specificExpectations: "",
 workEnvironmentDescription: "",
 emergencyContactNameNumber: "",
 applicationInstructions: "",
 contactPersonName: "",
 contactPhone: "",
 contactEmail: "",
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

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsLoading(true);

 try {
 // ✅ Payload mapping to match your Django Choices
 const payload = {
 title: jobData.title,
 description: jobData.description,
 salary: jobData.salary,
 location: jobData.location,
 job_type: jobData.jobType || "full-time", // Fallback to avoid 400
 preferred_gender: jobData.preferredGender,
 preferred_age_range: jobData.preferredAgeRange,
 language_requirements: jobData.languageRequirements.split(",").map((i) => i.trim()).filter(Boolean),
 experience_required: jobData.experienceRequired,
 skills_required: jobData.skillsRequired.split(",").map((i) => i.trim()).filter(Boolean),
 workplace_type: jobData.workplaceType,
 accommodation_provided: jobData.accommodationProvided,
 food_provided: jobData.foodProvided,
 work_schedule: jobData.workSchedule,
 full_time_salary: jobData.fullTimeSalary || null,
 part_time_salary: jobData.partTimeSalary || null,
 hourly_wage: jobData.hourlyWage || null,
 additional_benefits: jobData.additionalBenefits.split(",").map((i) => i.trim()).filter(Boolean),
 contract_type: jobData.contractType,
 recruitment_method: jobData.recruitmentMethod,
 work_permit_sponsorship: jobData.workPermitSponsorship,
 background_verification_required: jobData.backgroundVerificationRequired,
 preferred_nationality: jobData.preferredNationality,
 police_clearance_required: jobData.policeClearanceRequired,
 specific_expectations: jobData.specificExpectations,
 work_environment_description: jobData.workEnvironmentDescription,
 emergency_contact_name_number: jobData.emergencyContactNameNumber,
 application_instructions: jobData.applicationInstructions,
 contact_person_name: jobData.contactPersonName,
 contact_phone: jobData.contactPhone,
 contact_email: jobData.contactEmail,
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
 <header className="border-b border bg-white ">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
 <Link to="/employer/dashboard" className="flex items-center text-primary">
 <ArrowLeft className="h-4 w-4 mr-2" /> Back
 </Link>
 <span className="font-semibold">Create New Job Posting</span>
 </div>
 </header>

 <div className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8">
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
 <Label>Salary (Display)</Label>
 <Input name="salary" value={jobData.salary} onChange={handleInputChange} required />
 </div>
 </div>
 <div>
 <Label htmlFor="location">General Location</Label>
 <Input id="location" name="location" value={jobData.location} onChange={handleInputChange} placeholder="e.g. Downtown" required />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div><Label>Preferred Gender</Label><Input name="preferredGender" value={jobData.preferredGender} onChange={handleInputChange} placeholder="Male/Female/No Preference" /></div>
 <div><Label>Preferred Age Range</Label><Input name="preferredAgeRange" value={jobData.preferredAgeRange} onChange={handleInputChange} placeholder="26-35 / No Preference" /></div>
 <div><Label>Language Requirements</Label><Input name="languageRequirements" value={jobData.languageRequirements} onChange={handleInputChange} placeholder="English, Hindi" /></div>
 <div><Label>Experience Required</Label><Input name="experienceRequired" value={jobData.experienceRequired} onChange={handleInputChange} placeholder="1-2 Years" /></div>
 <div><Label>Skills Required</Label><Input name="skillsRequired" value={jobData.skillsRequired} onChange={handleInputChange} placeholder="Cleaning, Cooking" /></div>
 <div><Label>Workplace Type</Label><Input name="workplaceType" value={jobData.workplaceType} onChange={handleInputChange} placeholder="Home/Office/Cafe" /></div>
 <div><Label>Accommodation Provided</Label><Input name="accommodationProvided" value={jobData.accommodationProvided} onChange={handleInputChange} placeholder="Yes/No/Not Applicable" /></div>
 <div><Label>Food Provided</Label><Input name="foodProvided" value={jobData.foodProvided} onChange={handleInputChange} placeholder="Yes/No" /></div>
 <div><Label>Work Schedule</Label><Input name="workSchedule" value={jobData.workSchedule} onChange={handleInputChange} placeholder="6 Days a Week" /></div>
 <div><Label>Preferred Nationality</Label><Input name="preferredNationality" value={jobData.preferredNationality} onChange={handleInputChange} /></div>
 <div><Label>Contract Type</Label><Input name="contractType" value={jobData.contractType} onChange={handleInputChange} placeholder="Standard Employment Contract" /></div>
 <div><Label>Recruitment Method</Label><Input name="recruitmentMethod" value={jobData.recruitmentMethod} onChange={handleInputChange} placeholder="Direct / Agency" /></div>
 <div><Label>Work Permit Sponsorship</Label><Input name="workPermitSponsorship" value={jobData.workPermitSponsorship} onChange={handleInputChange} placeholder="Employer provides visa" /></div>
 <div><Label>Full-time Salary (AED)</Label><Input name="fullTimeSalary" type="number" value={jobData.fullTimeSalary} onChange={handleInputChange} /></div>
 <div><Label>Part-time Salary (AED)</Label><Input name="partTimeSalary" type="number" value={jobData.partTimeSalary} onChange={handleInputChange} /></div>
 <div><Label>Hourly Wage (AED)</Label><Input name="hourlyWage" type="number" value={jobData.hourlyWage} onChange={handleInputChange} /></div>
 <div><Label>Additional Benefits</Label><Input name="additionalBenefits" value={jobData.additionalBenefits} onChange={handleInputChange} placeholder="Weekly Off, Medical Insurance" /></div>
 <div><Label>Emergency Contact</Label><Input name="emergencyContactNameNumber" value={jobData.emergencyContactNameNumber} onChange={handleInputChange} /></div>
 </div>
 <div className="space-y-3">
 <div className="flex items-center space-x-2">
 <Checkbox id="backgroundVerificationRequired" checked={jobData.backgroundVerificationRequired} onCheckedChange={(checked) => setJobData(prev => ({ ...prev, backgroundVerificationRequired: !!checked }))} />
 <Label htmlFor="backgroundVerificationRequired">Background Verification Required</Label>
 </div>
 <div className="flex items-center space-x-2">
 <Checkbox id="policeClearanceRequired" checked={jobData.policeClearanceRequired} onCheckedChange={(checked) => setJobData(prev => ({ ...prev, policeClearanceRequired: !!checked }))} />
 <Label htmlFor="policeClearanceRequired">Police Clearance Required</Label>
 </div>
 </div>
 <div>
 <Label>Specific Expectations</Label>
 <Textarea name="specificExpectations" value={jobData.specificExpectations} onChange={handleInputChange} />
 </div>
 <div>
 <Label>Work Environment Description</Label>
 <Textarea name="workEnvironmentDescription" value={jobData.workEnvironmentDescription} onChange={handleInputChange} />
 </div>
 <div>
 <Label>How to Apply Instructions</Label>
 <Textarea name="applicationInstructions" value={jobData.applicationInstructions} onChange={handleInputChange} />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div><Label>Contact Person Name</Label><Input name="contactPersonName" value={jobData.contactPersonName} onChange={handleInputChange} /></div>
 <div><Label>Contact Phone</Label><Input name="contactPhone" value={jobData.contactPhone} onChange={handleInputChange} /></div>
 <div><Label>Contact Email</Label><Input type="email" name="contactEmail" value={jobData.contactEmail} onChange={handleInputChange} /></div>
 </div>
 </CardContent>
 </Card>

 <div className="flex justify-end space-x-4">
 <Button type="submit" className="btn-primary w-full px-8 sm:w-auto" disabled={isLoading}>
 {isLoading ? "Processing..." : "Publish Job"}
 </Button>
 </div>
 </form>
 </div>
 </div>
 );
};

export default PostJob;
