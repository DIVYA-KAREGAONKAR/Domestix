import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
 const location = useLocation();

 useEffect(() => {
 console.error(
 "404 Error: User attempted to access non-existent route:",
 location.pathname
 );
 }, [location.pathname]);

 return (
 <div className="min-h-screen bg-app-bg flex items-center justify-center px-4">
 <div className=" w-full max-w-md p-8 text-center">
 <h1 className="mb-4 text-4xl font-bold text-app-text">404</h1>
 <p className="mb-4 text-xl text-gray-600">Oops! Page not found</p>
 <a href="/" className="text-primary underline hover:text-primary/80">
 Return to Home
 </a>
 </div>
 </div>
 );
};

export default NotFound;
