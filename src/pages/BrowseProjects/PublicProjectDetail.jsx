import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Share2, LogIn, Calendar, CheckSquare, Award } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "../../utils/api";
import ProjectHeader from "./ProjectDetailComponents/ProjectHeader";
import ProjectDescription from "./ProjectDetailComponents/ProjectDescription";
import { useMetaTags } from "../../hooks/useMetaTags";
import { stripHtml } from "../../utils/text";

export default function PublicProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Query to fetch project details from the public endpoint
  const {
    data: detailData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-project-detail", id],
    queryFn: () => api.get(`/projects/public/${id}`),
    enabled: !!id,
  });

  const project = detailData?.project;
  const milestones = project?.milestones || [];
  const files = project?.files || [];

  const formattedBudget = project?.budget
    ? `₹${Number(project.budget).toLocaleString("en-IN")}`
    : "Undisclosed";

  const formattedStartDate = project?.start_date
    ? new Date(project.start_date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "TBD";

  const formattedHours = project?.estimated_hours
    ? `${Number(project.estimated_hours)} hrs`
    : "TBD";

  const formattedDeadline = project?.end_date
    ? new Date(project.end_date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "TBD";

  // Generate JobPosting Schema.org JSON-LD structured data for rich results and LLM indexes
  const jobSchema = project ? {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": project.title,
    "description": project.description ? stripHtml(project.description) : "GigFactory project opportunity",
    "datePosted": project.created_at || new Date().toISOString(),
    "validThrough": project.end_date || undefined,
    "employmentType": "CONTRACTOR",
    "hiringOrganization": {
      "@type": "Organization",
      "name": "GigFactory Client Partner",
      "logo": `${window.location.origin}/favicon.png`
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "IN"
      }
    },
    "baseSalary": project.budget ? {
      "@type": "MonetaryAmount",
      "currency": "INR",
      "value": {
        "@type": "QuantitativeValue",
        "value": Number(project.budget),
        "unitText": "PROJECT"
      }
    } : undefined,
    "skills": project.project_skills?.map(s => s.skill_name).join(', ') || undefined
  } : null;

  useMetaTags({
    title: project ? `${project.title} - Project Opportunity` : "Project Details",
    description: project ? `Apply for "${project.title}" on GigFactory. Category: ${project.category || 'General'}. Budget: ${formattedBudget}. Dynamic milestones & deliverables configured.` : "View project specifications and details.",
    keywords: project ? `${project.title}, ${project.category}, freelance contracts, milestones, gig work, ${project.project_skills?.map(s => s.skill_name).join(', ') || ''}` : "project specifications, gig details",
    jsonLd: jobSchema
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <div className="animate-spin w-8 h-8 border-4 border-[#70d64d] border-t-transparent rounded-full" />
        <span className="text-gray-400 text-sm">Loading project details...</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <p className="text-red-500 font-semibold text-sm">
          Project details could not be loaded or the project is no longer open.
        </p>
        <button
          onClick={() => navigate("/public-projects")}
          className="bg-transparent border border-[#23232a] px-4 py-2 rounded-[6px] text-xs hover:bg-white/5 text-white transition cursor-pointer"
        >
          Back to Browse Projects
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate("/public-projects")}
          className="flex items-center gap-2 text-gray-400 hover:text-white border-none bg-transparent cursor-pointer font-semibold text-[0.85rem] transition-colors"
        >
          <ArrowLeft size={16} /> Back to Open Opportunities
        </button>
      </div>

      {/* Project Header Component */}
      <ProjectHeader
        project={project}
        formattedBudget={formattedBudget}
        formattedStartDate={formattedStartDate}
        formattedDeadline={formattedDeadline}
        formattedHours={formattedHours}
      />

      {/* Details Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_0.9fr] gap-[20px] items-start">
        {/* Left main column */}
        <div className="flex flex-col gap-[20px]">
          
          {/* Project Description Component */}
          <ProjectDescription project={project} files={files} />

          {/* Public Project Milestones (Simpler view without submissions/reviews) */}
          <section className="bg-[#121215] border border-[#23232a] rounded-[10px] p-6 sm:p-8 flex flex-col gap-6">
            <header className="flex justify-between items-center border-b border-[#23232a] pb-4">
              <div className="space-y-1">
                <h2 className="text-white text-[1.1rem] sm:text-[1.2rem] font-bold flex items-center gap-2">
                  <Award size={18} className="text-[#70d64d]" />
                  Project Milestones & Stages
                </h2>
                <p className="text-[#8a8a8a] text-[0.78rem]">Estimated project stages, scope, and weight distribution.</p>
              </div>
            </header>

            {milestones.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-xs">
                No milestones defined for this project.
              </div>
            ) : (
              <div className="space-y-4">
                {milestones.map((m, index) => (
                  <div key={m.id || index} className="bg-[#0c0c0e] border border-[#1f1f24] rounded-[8px] p-4 flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-[#1e293b] border border-[#334155] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {m.milestone_no || index + 1}
                    </div>
                    <div className="space-y-2 flex-grow min-w-0">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <h4 className="text-white text-sm font-bold truncate">{m.title}</h4>
                        {m.weight_percentage && (
                          <span className="bg-[#1a2e1a] text-[#70d64d] text-[10px] font-bold px-2 py-0.5 rounded-[4px]">
                            Weight: {m.weight_percentage}%
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed break-words">{m.description || "No description provided."}</p>
                      {m.due_date && (
                        <div className="text-[11px] text-[#8a8a8a] flex items-center gap-1.5 pt-1">
                          <Calendar size={12} className="text-gray-500" />
                          Target Due Date: <span className="text-gray-300 font-semibold">{new Date(m.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-[20px]">
          
          {/* Guest CTA Card */}
          <div className="bg-[#121215] border border-[#23232a] rounded-[10px] p-6 space-y-4">
            <h3 className="text-white text-base font-bold">Interested in this project?</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Log in or register your profile with GigFactory to submit bids, propose milestones, and collaborate.
            </p>
            <button
              onClick={() => navigate(`/?redirect=/projects/${project.id}`)}
              className="w-full bg-[#70d64d] hover:bg-[#8ee67b] text-black border-none py-[11px] rounded-[6px] text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn size={14} />
              <span>Login & Apply Now</span>
            </button>
          </div>

          {/* Quick Specifications */}
          <div className="bg-[#121215] border border-[#23232a] rounded-[10px] p-6 space-y-4">
            <h4 className="text-white text-xs uppercase font-extrabold tracking-wider border-b border-[#23232a] pb-2">Project Info</h4>
            
            <div className="space-y-3">
              <div>
                <span className="text-gray-500 text-[10px] block uppercase font-bold">Category</span>
                <span className="text-gray-300 text-xs font-semibold">{project.category || "General"}</span>
              </div>
             
              <div>
                <span className="text-gray-500 text-[10px] block uppercase font-bold">Priority Level</span>
                <span className="text-gray-300 text-xs font-semibold capitalize">{project.priority || "medium"}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block uppercase font-bold">Project Type</span>
                <span className="text-gray-300 text-xs font-semibold capitalize">{project.project_type || "fixed"}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
