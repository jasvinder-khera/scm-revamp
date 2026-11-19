import React from "react";

const Loader = () => {
  return (
    <div className="flex items-center justify-center h-screen w-full">
      <div
        className="h-5 w-5 mr-2.5 rounded-full bg-blue-200 animate-pulse-dots"
        style={{ animationDelay: "-0.3s" }}
      />
      <div
        className="h-5 w-5 mr-2.5 rounded-full bg-blue-200 animate-pulse-dots"
        style={{ animationDelay: "-0.1s" }}
      />
      <div
        className="h-5 w-5 mr-2.5 rounded-full bg-blue-200 animate-pulse-dots"
        style={{ animationDelay: "0.1s" }}
      />
      <div className="h-5 w-5 mr-2.5 rounded-full bg-blue-200 animate-pulse-dots" />
      <div
        className="h-5 w-5 rounded-full bg-blue-200 animate-pulse-dots"
        style={{ animationDelay: "0.2s" }}
      />
    </div>
  );
};

export default Loader;
