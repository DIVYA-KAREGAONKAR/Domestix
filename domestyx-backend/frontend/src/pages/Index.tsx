import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Shield, Star } from "lucide-react";

const Index = () => {
 return (
   <div className="min-h-screen bg-app-bg">
    <header className="hidden md:block bg-white shadow-sm border-b">
      <div className="section-shell">
        <div className="stacked-header items-center justify-between py-4 md:py-3">
          <Link to="/" className="text-2xl font-bold text-primary">
            DomestyX
          </Link>
          <div className="flex flex-wrap gap-2 justify-center md:justify-end w-full">
            <Link to="/agency/login">
              <Button variant="outline">Agency</Button>
            </Link>
            <Link to="/government/login">
              <Button variant="outline">Government</Button>
            </Link>
            <Link to="/support-provider/login">
              <Button variant="outline">Support</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
    <header className="md:hidden bg-white shadow-sm border-b">
      <div className="section-shell">
          <div className="flex flex-col gap-3 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="text-2xl font-bold text-primary">
                DomestyX
              </Link>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <Link to="/agency/login">
                <Button size="xs" variant="outline" className="px-4 py-1">
                  Agency
                </Button>
              </Link>
              <Link to="/government/login">
                <Button size="xs" variant="outline" className="px-4 py-1">
                  Government
                </Button>
              </Link>
              <Link to="/support-provider/login">
                <Button size="xs" variant="outline" className="px-4 py-1">
                  Support
                </Button>
              </Link>
            </div>
          </div>
      </div>
    </header>

     <main className="space-y-12 py-12">
      <section className="md:hidden bg-gradient-to-br from-slate-50 via-white to-white">
        <div className="section-shell">
          <div className="rounded-3xl bg-white/85 p-6 shadow-md shadow-slate-200 text-center">
            <h2 className="text-2xl font-bold text-app-text mt-4">
              Connect with Trusted <span className="text-primary">Domestic Workers</span>
            </h2>
            <p className="text-base text-slate-600 mt-3 text-center max-w-xl mx-auto">
              DomestyX bridges the gap between skilled domestic workers and families who need reliable help.
              Find verified professionals or showcase your services with ease.
            </p>
            <div className="flex flex-wrap gap-3 mt-6 justify-center">
              <Link to="/worker/register">
                <Button size="lg" className="btn-primary px-6 py-3 text-base tracking-wide">
                  I'm a Worker
                </Button>
              </Link>
              <Link to="/employer/register">
                <Button size="lg" variant="outline" className="px-6 py-3 text-base border-primary text-primary hover:bg-primary hover:text-white">
                  I'm an Employer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="hidden md:block bg-app-bg">
        <div className="section-shell text-center pb-8">
          <h2 className="text-4xl md:text-6xl font-bold text-app-text mb-6">
            Connect with Trusted <span className="text-primary">Domestic Workers</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            DomestyX bridges the gap between skilled domestic workers and families who need reliable help.
            Find verified professionals or showcase your services with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/worker/register">
              <Button size="lg" className="btn-primary px-8 py-3 text-lg">
                I'm a Worker
              </Button>
            </Link>
            <Link to="/employer/register">
              <Button size="lg" variant="outline" className="px-8 py-3 text-lg border-primary text-primary hover:bg-primary hover:text-white">
                I'm an Employer
              </Button>
            </Link>
          </div>
        </div>
      </section>

       <section className="bg-white">
         <div className="section-shell text-center">
           <div className="mb-12">
             <h3 className="text-3xl font-bold text-app-text mb-4">Why Choose DomestyX?</h3>
             <p className="text-lg text-gray-600">Reliable connections, verified profiles, and secure transactions</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <Card className="text-center hover:shadow-lg transition-shadow duration-300">
               <CardHeader>
                 <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                   <Users className="h-6 w-6 text-primary" />
                 </div>
                 <CardTitle>Verified Profiles</CardTitle>
               </CardHeader>
               <CardContent className="p-6">
                 <CardDescription>
                   All workers go through our verification process to ensure quality and safety
                 </CardDescription>
               </CardContent>
             </Card>

             <Card className="text-center hover:shadow-lg transition-shadow duration-300">
               <CardHeader>
                 <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                   <Briefcase className="h-6 w-6 text-accent" />
                 </div>
                 <CardTitle>Wide Range of Services</CardTitle>
               </CardHeader>
               <CardContent className="p-6">
                 <CardDescription>
                   From cleaning to childcare, find the perfect match for your needs
                 </CardDescription>
               </CardContent>
             </Card>

             <Card className="text-center hover:shadow-lg transition-shadow duration-300">
               <CardHeader>
                 <div className="mx-auto w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-4">
                   <Shield className="h-6 w-6 text-success" />
                 </div>
                 <CardTitle>Secure Platform</CardTitle>
               </CardHeader>
               <CardContent className="p-6">
                 <CardDescription>
                   Your safety and privacy are our top priorities with secure transactions
                 </CardDescription>
               </CardContent>
             </Card>

             <Card className="text-center hover:shadow-lg transition-shadow duration-300">
               <CardHeader>
                 <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                   <Star className="h-6 w-6 text-primary" />
                 </div>
                 <CardTitle>Rated Reviews</CardTitle>
               </CardHeader>
               <CardContent className="p-6">
                 <CardDescription>
                   Read genuine reviews and ratings to make informed decisions
                 </CardDescription>
               </CardContent>
             </Card>
           </div>
         </div>
       </section>

      <section className="md:hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="section-shell py-12">
          <div className="text-center space-y-5">
            <h3 className="text-2xl font-bold">Ready to Get Started?</h3>
            <p className="text-base text-slate-200 mx-auto max-w-2xl">
              Join thousands of families and workers trusting DomestyX to streamline domestic hiring.
            </p>
            <div className="flex flex-wrap justify-center gap-5">
              <Link to="/worker/register">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 px-7 py-3 text-base">
                  Register as Worker
                </Button>
              </Link>
              <Link to="/employer/register">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 px-7 py-3 text-base">
                  Find Workers
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="hidden md:block bg-primary text-white">
        <div className="section-shell text-center py-18">
          <div className="max-w-5xl mx-auto space-y-6">
            <h3 className="text-3xl font-bold">Ready to Get Started?</h3>
            <p className="text-xl opacity-90">
              Join thousands of satisfied users who have found their perfect match.
            </p>
            <div className="flex flex-row flex-wrap justify-center gap-8">
              <Link to="/worker/register">
                <Button size="lg" variant="secondary" className="px-12 py-3 text-lg">
                  Register as Worker
                </Button>
              </Link>
              <Link to="/employer/register">
                <Button size="lg" variant="secondary" className="px-12 py-3 text-lg">
                  Find Workers
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
     </main>

     <footer className="bg-gray-800 text-white py-8">
       <div className="section-shell text-center">
         <p>&copy; 2024 DomestyX. All rights reserved.</p>
       </div>
     </footer>
   </div>
 );
};

export default Index;
