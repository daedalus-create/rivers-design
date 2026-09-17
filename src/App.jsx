import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Experience = lazy(() => import("./pages/Experience"));
const WorkExcerpts = lazy(() => import("./pages/WorkExcerpts"));
const ExperienceDetail = lazy(() => import("./pages/ExperienceDetail"));
const Resume = lazy(() => import("./pages/Resume"));
const Education = lazy(() => import("./pages/Education"));
const Classes = lazy(() => import("./pages/Classes"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectsCompleted = lazy(() => import("./pages/ProjectsCompleted"));
const ProjectsInProgress = lazy(() => import("./pages/ProjectsInProgress"));
const ProjectsPlanned = lazy(() => import("./pages/ProjectsPlanned"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/about/contact" element={<Contact />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/experience/work-excerpts" element={<WorkExcerpts />} />
        <Route path="/experience/resume" element={<Resume />} />
        <Route path="/experience/education" element={<Education />} />
        <Route path="/experience/classes" element={<Classes />} />
        <Route path="/experience/:slug" element={<ExperienceDetail />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/completed" element={<ProjectsCompleted />} />
        <Route path="/projects/in-progress" element={<ProjectsInProgress />} />
        <Route path="/projects/planned" element={<ProjectsPlanned />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
